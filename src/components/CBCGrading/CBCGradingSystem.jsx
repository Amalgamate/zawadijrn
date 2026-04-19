import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import HorizontalSubmenu from './layout/HorizontalSubmenu';
import MobileAppShell from './layout/MobileAppShell';
import PageRouter from './layout/PageRouter';
import GlobalModals from './layout/GlobalModals';
import ErrorBoundary from './shared/ErrorBoundary';
import CommandPalette from './layout/CommandPalette';

// Hooks
import { useLearners } from './hooks/useLearners';
import { useTeachers } from './hooks/useTeachers';
import { useParents } from './hooks/useParents';
import { useNotifications } from './hooks/useNotifications';
import { useLearnerActions } from './hooks/useLearnerActions';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useUIStore } from '../../store/useUIStore';

// Utils
import { clearAllSchoolData } from '../../utils/schoolDataCleanup';
import { refreshBus } from '../../utils/refreshBus';

/**
 * CBCGradingSystem - Orchestration Layer
 * Modernized entry point for the Zawadi SMS Grading & Management system.
 */
export default function CBCGradingSystem({ user, onLogout, brandingSettings, setBrandingSettings }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const mainContentRef = useRef(null);
  const parentPortal = user?.role === 'PARENT';

  // UI State from Zustand
  const { 
    sidebarOpen, setSidebarOpen, 
    currentPage, setCurrentPage, 
    pageParams,
    goBack, goForward
  } = useUIStore();

  // Dialog & Modal States
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingLearner, setEditingLearner] = useState(null);

  // Domain Hooks
  // enabled only when the user actually navigates to a page that needs that data.
  // This prevents 3 heavy API calls firing on every cold app load regardless
  // of which page the user actually opens first.
  const learnersNeeded = [
    'learners-list','learners-admissions','learners-promotion','learners-transfer-out',
    'attendance-daily','attendance-reports','assess-formative','assess-formative-report',
    'assess-summative-assessment','assess-summative-report','assess-termly-report',
    'assess-values','assess-cocurricular','assess-core-competencies','assess-summary-report',
    'assess-mobile-dashboard','learner-profile','dashboard',
  ];
  const teachersNeeded = [
    'teachers-list','add-teacher','teacher-profile','dashboard',
  ];
  const parentsNeeded = [
    'parents-list','parent-profile','dashboard',
  ];

  const learnerData = useLearners({ enabled: !parentPortal && learnersNeeded.includes(currentPage) });
  const teacherData = useTeachers({ enabled: !parentPortal && teachersNeeded.includes(currentPage) });
  const parentData  = useParents({  enabled: !parentPortal && parentsNeeded.includes(currentPage)  });
  const notify = useNotifications();

  // Navigation with History & Params
  const handleNavigate = useCallback((page, params = {}) => {
    if (params.learner) setEditingLearner(params.learner);
    if (params.teacher) setEditingTeacher(params.teacher);
    setCurrentPage(page, params); // Updates zustand

    // Push real browser history. We prefix the URL with a tiny harmless hash so the browser 
    // actually logs a new distinct entry that the back button can pop.
    try {
      // Ensure we preserve the #/app prefix so the global HashRouter doesn't detect a 
      // route escape and trigger a redirect loop.
      const currentUrl = new URL(window.location.href);
      const uniqueHash = `#${page}`;
      
      // We want to keep #/app and just append/replace the secondary hash
      const newUrl = `${currentUrl.pathname}${currentUrl.search}#/app${uniqueHash}`;
      
      window.history.pushState(
          { appPage: page, appParams: params }, 
          '', 
          newUrl
      );
    } catch (e) {
      console.error('History push failed:', e);
    }
  }, [setCurrentPage]);

  // Intercept browser back/forward — prevent escaping to /auth/login
  useEffect(() => {
    // Make sure our very first load anchors the current app page in the real browser history
    if (!window.history.state?.appPage) {
        window.history.replaceState({ appPage: currentPage, appParams: pageParams }, '', window.location.href);
    }

    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.appPage) {
        // Safe in-app navigation
        if (state.appParams?.learner) setEditingLearner(state.appParams.learner);
        
        // Use useUIStore.setState directly to avoid circular dependency in useEffect
        useUIStore.setState({ 
            currentPage: state.appPage, 
            pageParams: state.appParams || {} 
        });
      } else {
        // User hit back too far and escaped the initial app boundary. 
        // We push them FORWARD again into the app immediately
        window.history.pushState({ appPage: 'dashboard', appParams: {} }, '', window.location.href);
        useUIStore.setState({ currentPage: 'dashboard', pageParams: {} });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // Only register once

  // Combined Learner Actions
  const learnerActions = useLearnerActions({
    ...learnerData,
    ...notify,
    setEditingLearner,
    setCurrentPage,
    setShowConfirmDialog,
    setConfirmAction,
    learners: learnerData.learners
  });

  // Local Handlers (Simplified)
  const handleLogout = () => {
    setConfirmAction(() => () => {
      setShowConfirmDialog(false);
      clearAllSchoolData();
      onLogout();
    });
    setShowConfirmDialog(true);
  };

  const handleAddLearner = () => {
    localStorage.removeItem('admission-form-draft');
    setEditingLearner(null);
    setCurrentPage('learners-admissions');
  };

  const handleEditLearner = (learner) => {
    setEditingLearner(learner);
    setCurrentPage('learners-admissions');
  };

  const handleSaveTeacher = async (tForm) => {
    const result = editingTeacher 
      ? await teacherData.updateTeacher(editingTeacher.id, tForm)
      : await teacherData.createTeacher(tForm);
    
    if (result.success) {
      notify.showSuccess(`Tutor ${editingTeacher ? 'updated' : 'added'} successfully!`);
      setCurrentPage('teachers-list');
      setEditingTeacher(null);
      refreshBus.emit('teachers');
    } else {
      notify.showError(`Error: ${result.error}`);
    }
  };

  const handleDeleteTeacher = (teacherId) => {
    setConfirmAction(() => async () => {
      const isSuperAdmin = user?.role === 'SUPER_ADMIN';
      const result = isSuperAdmin ? await teacherData.deleteTeacher(teacherId) : await teacherData.archiveTeacher(teacherId);
      if (result.success) notify.showSuccess('Operation successful');
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const handleSaveParent = async (pData) => {
    const result = editingParent ? await parentData.updateParent(editingParent.id, pData) : await parentData.createParent(pData);
    if (result.success) {
      notify.showSuccess(`Parent ${editingParent ? 'updated' : 'added'} successfully!`);
      setShowParentModal(false);
      setEditingParent(null);
      refreshBus.emit('parents');
    } else {
      notify.showError(`Error: ${result.error}`);
    }
  };

  // Bundle handlers for the router
  const handlers = {
    handleNavigate,
    setCurrentPage,
    setEditingLearner,
    setEditingTeacher,
    setBrandingSettings,
    handleAddLearner,
    handleEditLearner,
    handleMarkAsExited: learnerActions.handleMarkAsExited, // Assuming added to hook or keep here
    handleViewLearner: (learner) => handleNavigate('learner-profile', { learner }),
    handleArchiveParent: (pid) => { setConfirmAction(() => async () => { await parentData.archiveParent(pid); setShowConfirmDialog(false); }); setShowConfirmDialog(true); },
    fetchLearners: learnerData.fetchLearners,
    fetchTeachers: teacherData.fetchTeachers,
    fetchParents: parentData.fetchParents,
    handleAddTeacher: () => { setEditingTeacher(null); setCurrentPage('add-teacher'); },
    handleEditTeacher: (t) => { setEditingTeacher(t); setCurrentPage('add-teacher'); },
    handleViewTeacher: (t) => handleNavigate('teacher-profile', { teacher: t }),
    handleAddParent: () => { setEditingParent(null); setShowParentModal(true); },
    handleEditParent: (p) => { setEditingParent(p); setShowParentModal(true); },
    handleViewParent: (p) => handleNavigate('parent-profile', { parent: p }),
    ...learnerActions,
    ...notify,
    handleSaveTeacher,
    handleDeleteTeacher,
    handleSaveParent
  };

  // Layout selection
  if (isMobile) {
    return (
      <MobileAppShell
        user={user}
        brandingSettings={brandingSettings}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        setBrandingSettings={setBrandingSettings}
      >
        <ErrorBoundary>
          <PageRouter
            currentPage={currentPage} 
            pageParams={pageParams} 
            user={user}
            learners={learnerData.learners}
            teachers={teacherData.teachers}
            parents={parentData.parents}
            pagination={learnerData.pagination}
            teacherPagination={teacherData.pagination}
            parentPagination={parentData.pagination}
            learnersLoading={learnerData.loading}
            brandingSettings={brandingSettings}
            editingLearner={editingLearner} 
            editingTeacher={editingTeacher}
            handlers={handlers}
          />
        </ErrorBoundary>
        <GlobalModals
          showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} confirmAction={confirmAction}
          showParentModal={showParentModal} setShowParentModal={setShowParentModal} editingParent={editingParent}
          handleSaveParent={handleSaveParent} {...notify}
        />
      </MobileAppShell>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter border-t-2 border-[var(--brand-teal)]">
      <CommandPalette onNavigate={handleNavigate} />
      <Sidebar 
        user={user} 
        brandingSettings={brandingSettings} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
        <HorizontalSubmenu currentPage={currentPage} onNavigate={handleNavigate} />
        <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] p-6">
          <div className="max-w-screen-2xl mx-auto">
          <ErrorBoundary>
            <PageRouter
              currentPage={currentPage} 
              pageParams={pageParams} 
              user={user}
              learners={learnerData.learners}
              teachers={teacherData.teachers}
              parents={parentData.parents}
              pagination={learnerData.pagination}
              teacherPagination={teacherData.pagination}
              parentPagination={parentData.pagination}
              learnersLoading={learnerData.loading}
              brandingSettings={brandingSettings}
              editingLearner={editingLearner} 
              editingTeacher={editingTeacher}
              handlers={handlers}
            />
          </ErrorBoundary>
          </div>
        </main>
        <GlobalModals
          showConfirmDialog={showConfirmDialog} setShowConfirmDialog={setShowConfirmDialog} confirmAction={confirmAction}
          showParentModal={showParentModal} setShowParentModal={setShowParentModal} editingParent={editingParent}
          handleSaveParent={handleSaveParent} {...notify}
        />
      </div>
    </div>
  );
}
