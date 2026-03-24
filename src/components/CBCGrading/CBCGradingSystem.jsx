import React, { useState, useCallback, useRef } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import MobileAppShell from './layout/MobileAppShell';
import PageRouter from './layout/PageRouter';
import GlobalModals from './layout/GlobalModals';
import ErrorBoundary from './shared/ErrorBoundary';

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

/**
 * CBCGradingSystem - Orchestration Layer
 * Modernized entry point for the Zawadi SMS Grading & Management system.
 */
export default function CBCGradingSystem({ user, onLogout, brandingSettings, setBrandingSettings }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const mainContentRef = useRef(null);

  // UI State from Zustand
  const { 
    sidebarOpen, setSidebarOpen, 
    currentPage, setCurrentPage, 
    pageParams, toggleSection, expandedSections 
  } = useUIStore();

  // Dialog & Modal States
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingLearner, setEditingLearner] = useState(null);

  // Domain Hooks
  const learnerData = useLearners();
  const teacherData = useTeachers();
  const parentData = useParents();
  const notify = useNotifications();

  // Navigation with History & Params
  const handleNavigate = useCallback((page, params = {}) => {
    if (params.learner) setEditingLearner(params.learner);
    setCurrentPage(page, params);

    try {
      window.history.pushState({ page, params }, `CBC - ${page}`, window.location.href);
    } catch (e) {
      console.error('History push failed:', e);
    }
  }, [setCurrentPage]);

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
      <MobileAppShell user={user} brandingSettings={brandingSettings} onLogout={handleLogout}>
        <ErrorBoundary>
          <PageRouter
            currentPage={currentPage} pageParams={pageParams} user={user}
            {...learnerData} {...teacherData} {...parentData}
            brandingSettings={brandingSettings}
            editingLearner={editingLearner} editingTeacher={editingTeacher}
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <Sidebar 
        user={user} 
        brandingSettings={brandingSettings} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header user={user} />
        <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] p-6">
          <div className="max-w-screen-2xl mx-auto">
          <ErrorBoundary>
            <PageRouter
              currentPage={currentPage} pageParams={pageParams} user={user}
              {...learnerData} {...teacherData} {...parentData}
              brandingSettings={brandingSettings}
              editingLearner={editingLearner} editingTeacher={editingTeacher}
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
