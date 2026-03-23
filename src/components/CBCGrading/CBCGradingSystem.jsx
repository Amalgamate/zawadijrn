/**
 * CBCGradingSystem
 * Main component using extracted modules
 */

import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import Toast from './shared/Toast';
import ConfirmDialog from './shared/ConfirmDialog';
import EmptyState from './shared/EmptyState';
import AddEditParentModal from './shared/AddEditParentModal';
import MobileAppShell from './layout/MobileAppShell';
import { useMediaQuery } from './hooks/useMediaQuery';

// Hooks
import { useLearners } from './hooks/useLearners';
import { useTeachers } from './hooks/useTeachers';
import { useParents } from './hooks/useParents';
import { useNotifications } from './hooks/useNotifications';
import { API_BASE_URL, feeAPI, configAPI } from '../../services/api';

// Utils
import { PAGE_TITLES } from './utils/constants';
import { clearAllSchoolData } from '../../utils/schoolDataCleanup';

// Lazy load page components for better performance
const RoleDashboard = lazy(() => import('./pages/dashboard/RoleDashboard'));
const LearnersList = lazy(() => import('./pages/LearnersList'));
const TeachersList = lazy(() => import('./pages/TeachersList'));
const AddEditTeacherPage = lazy(() => import('./pages/AddEditTeacherPage'));
const ParentsList = lazy(() => import('./pages/ParentsList'));
const LearningHubPage = lazy(() => import('./pages/LearningHubPage'));
const PromotionPage = lazy(() => import('./pages/PromotionPage'));
const TransferOutPage = lazy(() => import('./pages/TransferOutPage'));
const DailyAttendance = lazy(() => import('./pages/DailyAttendanceAPI'));
const AttendanceReports = lazy(() => import('./pages/AttendanceReports'));
const AdmissionsPage = lazy(() => import('./pages/AdmissionsPage'));
const TransfersInPage = lazy(() => import('./pages/TransfersInPage'));
const ExitedLearnersPage = lazy(() => import('./pages/ExitedLearnersPage'));
const FormativeAssessment = lazy(() => import('./pages/FormativeAssessment'));
const FormativeReport = lazy(() => import('./pages/FormativeReport'));
const MobileAssessmentsDashboard = lazy(() => import('./pages/MobileAssessmentsDashboard'));
const SummativeTestsRouter = lazy(() => import('./pages/SummativeTestsRouter'));
const SummativeAssessmentRouter = lazy(() => import('./pages/SummativeAssessmentRouter'));
const SummativeReport = lazy(() => import('./pages/SummativeReport'));
const TermlyReport = lazy(() => import('./pages/TermlyReport'));
const ValuesAssessment = lazy(() => import('./pages/ValuesAssessment'));
const CoCurricularActivities = lazy(() => import('./pages/CoCurricularActivities'));
const CoreCompetenciesAssessment = lazy(() => import('./pages/CoreCompetenciesAssessment'));
const SummaryReportPage = lazy(() => import('./pages/reports/SummaryReportPage'));
const PerformanceScale = lazy(() => import('./pages/PerformanceScale'));
const LearningAreasManagement = lazy(() => import('./pages/LearningAreasManagement'));
const FacilityManager = lazy(() => import('./pages/FacilityManager'));
const NoticesPage = lazy(() => import('./pages/NoticesPage'));
const InventoryList = lazy(() => import('./pages/InventoryList'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const MessageHistoryPage = lazy(() => import('./pages/MessageHistoryPage'));
const SupportHub = lazy(() => import('./pages/SupportHub'));
const TimetablePage = lazy(() => import('./pages/TimetablePage'));
const CodingPlayground = lazy(() => import('./pages/CodingPlayground'));
const ClassList = lazy(() => import('./pages/ClassList'));
const CreateClassForm = lazy(() => import('./pages/CreateClassForm'));
const ClassDetailPage = lazy(() => import('./pages/ClassDetailPage'));
const SchoolSettings = lazy(() => import('./pages/settings/SchoolSettings'));
const AcademicSettings = lazy(() => import('./pages/settings/AcademicSettings'));
const UserManagement = lazy(() => import('./pages/settings/UserManagement'));
const BrandingSettings = lazy(() => import('./pages/settings/BrandingSettings'));
const BackupSettings = lazy(() => import('./pages/settings/BackupSettings'));
const CommunicationSettings = lazy(() => import('./pages/settings/CommunicationSettings'));
const PaymentSettings = lazy(() => import('./pages/settings/PaymentSettings'));
const FeeCollectionPage = lazy(() => import('./pages/FeeCollectionPage'));
const FeeStructurePage = lazy(() => import('./pages/FeeStructurePage'));
const FeeReportsPage = lazy(() => import('./pages/FeeReportsPage'));
const StudentStatementsPage = lazy(() => import('./pages/StudentStatementsPage'));
const DocumentCenter = lazy(() => import('./pages/DocumentCenter'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const LearnerProfile = lazy(() => import('./pages/profiles/LearnerProfile'));
const TeacherProfile = lazy(() => import('./pages/profiles/TeacherProfile'));
const ParentProfile = lazy(() => import('./pages/profiles/ParentProfile'));
const PlannerLayout = lazy(() => import('./pages/planner/PlannerLayout'));

// Student sub-modules
const UniformAllocationPage = lazy(() => import('./pages/UniformAllocationPage'));
const IDPrintingPage = lazy(() => import('./pages/IDPrintingPage'));

// HR Module
const HRManager = lazy(() => import('./pages/hr/HRManager'));
const StaffDirectory = lazy(() => import('./pages/hr/StaffDirectory'));
const LeaveManager = lazy(() => import('./pages/hr/LeaveManager'));
const PayrollManager = lazy(() => import('./pages/hr/PayrollManager'));
const StaffDocuments = lazy(() => import('./pages/hr/StaffDocuments'));
const PerformanceManager = lazy(() => import('./pages/hr/PerformanceManager'));

// Accounting Module
const AccountingManager = lazy(() => import('./pages/accounting/AccountingManager'));
const ChartOfAccounts = lazy(() => import('./pages/accounting/ChartOfAccounts'));
const JournalEntries = lazy(() => import('./pages/accounting/JournalEntries'));
const ExpenseManager = lazy(() => import('./pages/accounting/ExpenseManager'));
const VendorManager = lazy(() => import('./pages/accounting/VendorManager'));
const BankReconciliation = lazy(() => import('./pages/accounting/BankReconciliation'));
const FinancialReports = lazy(() => import('./pages/accounting/FinancialReports'));

// Inventory Module
const InventoryItems = lazy(() => import('./pages/inventory/InventoryItems'));
const InventoryCategories = lazy(() => import('./pages/inventory/InventoryCategories'));
const InventoryStores = lazy(() => import('./pages/inventory/InventoryStores'));
const StockMovements = lazy(() => import('./pages/inventory/StockMovements'));
const StockRequisitions = lazy(() => import('./pages/inventory/StockRequisitions'));
const StockTransfers = lazy(() => import('./pages/inventory/StockTransfers'));
const StockAdjustments = lazy(() => import('./pages/inventory/StockAdjustments'));
const AssetRegister = lazy(() => import('./pages/inventory/AssetRegister'));
const AssetAssignments = lazy(() => import('./pages/inventory/AssetAssignments'));


// Premium Loading Component for Lazy Transitions
const LoadingOverlay = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm animate-in fade-in duration-500">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-[#0D9488]/20 border-t-[#0D9488] rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#0D9488]/10 rounded-full animate-pulse"></div>
      </div>
    </div>
    <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse tracking-wide uppercase">
      Optimizing Experience...
    </p>
  </div>
);

export default function CBCGradingSystem({ user, onLogout, brandingSettings, setBrandingSettings }) {
  // Main Content Scroll Ref
  const mainContentRef = React.useRef(null);
  // Mobile Detection
  const isMobile = useMediaQuery('(max-width: 767px)');

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Initialize pageParams from localStorage to survive refreshes
  const [pageParams, setPageParams] = useState(() => {
    try {
      const saved = localStorage.getItem('cbc_page_params');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Persist pageParams changes
  React.useEffect(() => {
    try {
      localStorage.setItem('cbc_page_params', JSON.stringify(pageParams));
    } catch (e) {
      console.error('Failed to save page params', e);
    }
  }, [pageParams]);

  // Initialize from localStorage or default to 'dashboard'
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return localStorage.getItem('cbc_current_page') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  // Initialize from localStorage or default
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('cbc_expanded_sections');
      return saved ? JSON.parse(saved) : {
        dashboard: true,
        learners: false,
        teachers: false,
        attendance: false,
        communications: false,
        assessment: false,
        'learning-hub': false,
        finance: false,
        settings: false
      };
    } catch (e) {
      return {
        dashboard: true,
        learners: false,
        teachers: false,
        attendance: false,
        communications: false,
        assessment: false,
        'learning-hub': false,
        finance: false,
        settings: false
      };
    }
  });

  // Persist currentPage changes
  React.useEffect(() => {
    try {
      localStorage.setItem('cbc_current_page', currentPage);
    } catch (e) {
      console.error('Failed to save page state', e);
    }
  }, [currentPage]);

  React.useEffect(() => {
    // School persistence logic removed for single-tenant mode
  }, [user]);

  // Persist expandedSections changes
  React.useEffect(() => {
    try {
      localStorage.setItem('cbc_expanded_sections', JSON.stringify(expandedSections));
    } catch (e) {
      console.error('Failed to save sidebar state', e);
    }
  }, [expandedSections]);

  // Handle page navigation from child components
  React.useEffect(() => {
    const handlePageNavigate = (event) => {
      const { page, params } = event.detail;
      setCurrentPage(page);
      setPageParams(params);
    };

    window.addEventListener('pageNavigate', handlePageNavigate);
    return () => window.removeEventListener('pageNavigate', handlePageNavigate);
  }, []);

  // Restore scroll position when page changes
  React.useEffect(() => {
    if (mainContentRef.current) {
      const savedScroll = localStorage.getItem(`cbc_scroll_${currentPage}`);
      if (savedScroll) {
        // Use a small delay to ensure content is rendered before scrolling
        const timer = setTimeout(() => {
          if (mainContentRef.current) {
            mainContentRef.current.scrollTop = parseInt(savedScroll, 10);
          }
        }, 100);
        return () => clearTimeout(timer);
      } else {
        mainContentRef.current.scrollTop = 0;
      }
    }
  }, [currentPage]);

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    localStorage.setItem(`cbc_scroll_${currentPage}`, scrollTop);
  };

  // Handle browser back button
  React.useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        setPageParams(event.state.params || {});
        if (event.state.params?.learner) {
          setEditingLearner(event.state.params.learner);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Confirmation Dialog State
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Parent Modal State
  const [showParentModal, setShowParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState(null);

  const [editingTeacher, setEditingTeacher] = useState(null);

  // Learner Modal State - VIEW MODAL REMOVED
  const [editingLearner, setEditingLearner] = useState(null);

  const {
    learners,
    pagination,
    createLearner,
    updateLearner,
    deleteLearner,
    bulkDeleteLearners,
    fetchLearners,
    loading: learnersLoading,
    promoteLearners,
    transferOutLearner,
  } = useLearners();

  const {
    teachers,
    pagination: teacherPagination,
    fetchTeachers,
    setSelectedTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    archiveTeacher,
  } = useTeachers();

  const {
    parents,
    pagination: parentPagination,
    fetchParents,
    setSelectedParent,
    createParent,
    updateParent,
    archiveParent,
    deleteParent,
  } = useParents();

  const {
    showToast,
    toastMessage,
    toastType,
    showSuccess,
    hideNotification,
    showError
  } = useNotifications();

  // Handlers
  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const isOpening = !prev[section];
      if (isOpening) {
        // Close all other sections
        const newState = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        newState[section] = true;
        return newState;
      } else {
        // Just toggling off
        return { ...prev, [section]: false };
      }
    });
  };

  const handleNavigate = (page, params = {}) => {
    setPageParams(params);
    if (params.learner) {
      setEditingLearner(params.learner);
    }
    setCurrentPage(page);

    // Push to browser history so back button works
    try {
      window.history.pushState(
        { page, params },
        `CBC - ${page}`,
        window.location.href
      );
    } catch (e) {
      console.error('Failed to push history state:', e);
    }
  };

  const handleLogout = () => {
    setConfirmAction(() => () => {
      setShowConfirmDialog(false);

      // Clear all school-specific data from localStorage
      const result = clearAllSchoolData();
      console.log('Logout cleanup:', result);

      onLogout();
    });
    setShowConfirmDialog(true);
  };

  const handleAddLearner = () => {
    localStorage.removeItem('admission-form-draft'); // Ensure fresh form
    setEditingLearner(null);
    setCurrentPage('learners-admissions');
  };

  const handleEditLearner = (learner) => {
    setEditingLearner(learner);
    setCurrentPage('learners-admissions');
  };

  const handleViewLearner = (learner) => {
    handleNavigate('learner-profile', { learner });
  };

  const handleSaveLearner = async (learnerData) => {
    // Extract custom flags
    const { generateInvoice, ...dataToSave } = learnerData;

    // Use learnerData.id as the source of truth for edit vs create.
    // editingLearner state can be lost across Suspense remounts, so we
    // fall back to the id embedded in the form data itself.
    const learnerId = editingLearner?.id || learnerData.id;

    if (learnerId) {
      const result = await updateLearner(learnerId, dataToSave);
      if (result?.success) {
        showSuccess('Student updated successfully!');
        setEditingLearner(null);
      } else {
        showError('Error updating student: ' + (result?.error || 'Unknown error'));
      }
      return result;
    } else {
      const result = await createLearner(dataToSave);

      if (result.success) {
        showSuccess('Student added successfully!');

        // Handle Automatic Invoice Generation
        if (generateInvoice) {
          try {
            console.log('🔄 Starting automatic invoice generation for new learner...');
            const newLearner = result.data;

            let term = 'TERM_1';
            let academicYear = new Date().getFullYear();

            try {
              if (true) {
                const termResp = await configAPI.getTermConfigs();
                const activeConfig = termResp.data?.find(t => t.isCurrent) || termResp.data?.[0];
                if (activeConfig) {
                  term = activeConfig.term;
                  academicYear = activeConfig.year;
                }
              }
            } catch (err) {
              console.warn('Failed to fetch term config, using defaults', err);
            }

            const grade = newLearner.grade;
            const feeStructsResp = await feeAPI.getAllFeeStructures({
              grade,
              term,
              academicYear
            });

            let targetFeeStructureId = null;

            if (feeStructsResp.success && feeStructsResp.data && feeStructsResp.data.length > 0) {
              targetFeeStructureId = feeStructsResp.data[0].id;
            } else {
              console.log('🌱 No fee structure found. Seeding defaults...');
              showSuccess(`Seeding default fee structures for ${grade}...`);

              await feeAPI.seedDefaultFeeStructures();

              const retryResp = await feeAPI.getAllFeeStructures({ grade, term, academicYear });
              if (retryResp.success && retryResp.data?.length > 0) {
                targetFeeStructureId = retryResp.data[0].id;
              }
            }

            if (targetFeeStructureId) {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 30);

              await feeAPI.createInvoice({
                learnerId: newLearner.id,
                feeStructureId: targetFeeStructureId,
                term,
                academicYear,
                dueDate: dueDate.toISOString()
              });

              showSuccess('✅ Invoice generated automatically!');
            } else {
              console.warn('Could not find or create a valid Fee Structure for auto-invoicing.');
            }
          } catch (invoiceError) {
            console.error('Failed to auto-generate invoice:', invoiceError);
          }
        }
      } else {
        const errorMsg = typeof result?.error === 'object' ? JSON.stringify(result?.error) : result?.error;
        showError('Error creating student: ' + errorMsg);
      }
      return result;
    }
  };

  const handleMarkAsExited = (learnerId) => {
    setConfirmAction(() => () => {
      const learner = learners.find(l => l.id === learnerId);
      if (learner) {
        updateLearner({ ...learner, status: 'Exited' });
        showSuccess('Learner marked as exited successfully');
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteLearner = async (learnerId) => {
    setConfirmAction(() => async () => {
      const result = await deleteLearner(learnerId);
      if (result.success) {
        showSuccess('Student deleted successfully');
      } else {
        showSuccess('Error deleting student: ' + result.error);
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const handleBulkDeleteLearners = React.useCallback(async (learnerIds) => {
    const result = await bulkDeleteLearners(learnerIds);
    if (result.success) {
      const count = learnerIds.length;
      showSuccess(`${count} student${count !== 1 ? 's' : ''} deleted successfully`);
    } else {
      showSuccess(result.error || 'Error deleting students');
    }
  }, [bulkDeleteLearners, showSuccess]);

  const handlePromoteLearners = async (learnerIds, nextGrade) => {
    const result = await promoteLearners(learnerIds, nextGrade);
    if (!result.success && result.error) {
      showSuccess('Error promoting students: ' + result.error);
    }
    return result;
  };

  const handleTransferOut = async (transferData) => {
    const result = await transferOutLearner(transferData);
    if (result.success) {
      showSuccess('Student transfer processed successfully');
      setCurrentPage('learners-exited');
    } else {
      showSuccess('Error processing transfer: ' + result.error);
    }
    return result;
  };

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setCurrentPage('add-teacher');
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setCurrentPage('add-teacher');
  };

  const handleSaveTeacher = async (teacherData) => {
    if (editingTeacher) {
      const result = await updateTeacher(editingTeacher.id, teacherData);
      if (result.success) {
        showSuccess('Tutor updated successfully!');
        setCurrentPage('teachers-list');
        setEditingTeacher(null);
      } else {
        showError('Error updating tutor: ' + result.error);
      }
    } else {
      const result = await createTeacher(teacherData);
      if (result.success) {
        showSuccess('Tutor added successfully!');
        setCurrentPage('teachers-list');
      } else {
        showError('Error creating tutor: ' + result.error);
      }
    }
  };

  const handleViewTeacher = (teacher) => {
    handleNavigate('teacher-profile', { teacher });
  };

  const handleDeleteTeacher = async (teacherId) => {
    setConfirmAction(() => async () => {
      const isSuperAdmin = user?.role === 'SUPER_ADMIN';
      const result = isSuperAdmin
        ? await deleteTeacher(teacherId)
        : await archiveTeacher(teacherId);

      if (result.success) {
        showSuccess(isSuperAdmin ? 'Tutor deleted successfully' : 'Tutor archived successfully');
      } else {
        showSuccess('Error: ' + result.error);
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  // Parent handlers
  const handleAddParent = () => {
    setEditingParent(null);
    setShowParentModal(true);
  };

  const handleEditParent = (parent) => {
    setEditingParent(parent);
    setShowParentModal(true);
  };

  const handleViewParent = (parent) => {
    handleNavigate('parent-profile', { parent });
  };

  const handleSaveParent = async (parentData) => {
    if (editingParent) {
      const result = await updateParent(editingParent.id, parentData);
      if (result.success) {
        showSuccess('Parent updated successfully!');
        setShowParentModal(false);
        setEditingParent(null);
      } else {
        showSuccess('Error updating parent: ' + result.error);
      }
    } else {
      const result = await createParent(parentData);
      if (result.success) {
        showSuccess('Parent added successfully!');
        setShowParentModal(false);
      } else {
        showSuccess('Error creating parent: ' + result.error);
      }
    }
  };

  const handleDeleteParent = async (parentId) => {
    setConfirmAction(() => async () => {
      const result = await deleteParent(parentId);
      if (result.success) {
        showSuccess('Parent deleted successfully');
      } else {
        showSuccess('Error deleting parent: ' + result.error);
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const handleArchiveParent = async (parentId) => {
    setConfirmAction(() => async () => {
      const result = await archiveParent(parentId);
      if (result.success) {
        showSuccess('Parent archived successfully');
      } else {
        showSuccess('Error archiving parent: ' + result.error);
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  // Render Current Page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <RoleDashboard learners={learners} pagination={pagination} teachers={teachers} user={user} onNavigate={handleNavigate} />;

      // Planner Module
      case 'planner-calendar':
      case 'planner-timetable':
      case 'planner-agenda':
      case 'planner-schemes':
        return <PlannerLayout currentPage={currentPage} onNavigate={handleNavigate} />;

      // Learners Module
      case 'learners-list':
        return (
          <LearnersList
            learners={learners}
            loading={learnersLoading}
            pagination={pagination}
            onFetchLearners={fetchLearners}
            onAddLearner={handleAddLearner}
            onEditLearner={handleEditLearner}
            onViewLearner={handleViewLearner}
            onMarkAsExited={handleMarkAsExited}
            onDeleteLearner={handleDeleteLearner}
            onBulkDelete={handleBulkDeleteLearners}
            onRefresh={fetchLearners}
          />
        );
      case 'learners-admissions':
        return (
          <AdmissionsPage
            onSave={handleSaveLearner}
            onCancel={() => {
              setCurrentPage('learners-list');
              setEditingLearner(null);
            }}
            onDelete={editingLearner ? () => handleDeleteLearner(editingLearner.id) : null}
            learner={editingLearner}
          />
        );
      case 'learners-transfers-in':
        return <TransfersInPage />;
      case 'learners-exited':
        return <ExitedLearnersPage />;
      case 'learners-promotion':
        return (
          <PromotionPage
            learners={learners}
            onPromote={handlePromoteLearners}
            showNotification={(msg, type) => showSuccess(msg)}
          />
        );
      case 'learners-transfer-out':
        return (
          <TransferOutPage
            learners={learners}
            onTransferOut={handleTransferOut}
            showNotification={(msg, type) => showSuccess(msg)}
          />
        );

      // ── Student sub-modules ──────────────────────────────────────────────
      case 'learners-uniform':
        return <UniformAllocationPage />;
      case 'learners-id-print':
        return <IDPrintingPage />;
      // ────────────────────────────────────────────────────────────────────

      case 'learner-profile':
        return (
          <LearnerProfile
            learner={pageParams.learner}
            onBack={() => handleNavigate('learners-list')}
            brandingSettings={brandingSettings}
            onNavigate={handleNavigate}
          />
        );

      // Teachers Module
      case 'teachers-list':
        return (
          <TeachersList
            teachers={teachers}
            pagination={teacherPagination}
            onFetchTeachers={fetchTeachers}
            onAddTeacher={handleAddTeacher}
            onEditTeacher={handleEditTeacher}
            onViewTeacher={handleViewTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onRefresh={fetchTeachers}
          />
        );
      case 'teacher-profile':
        return (
          <TeacherProfile
            teacher={pageParams.teacher}
            onBack={() => handleNavigate('teachers-list')}
            onEdit={handleEditTeacher}
          />
        );
      case 'add-teacher':
        return (
          <AddEditTeacherPage
            onSave={handleSaveTeacher}
            onCancel={() => {
              setCurrentPage('teachers-list');
              setEditingTeacher(null);
            }}
            teacher={editingTeacher}
          />
        );

      // Parents Module
      case 'parents-list':
        return (
          <ParentsList
            parents={parents}
            pagination={parentPagination}
            onFetchParents={fetchParents}
            onAddParent={handleAddParent}
            onEditParent={handleEditParent}
            onViewParent={handleViewParent}
            onDeleteParent={handleDeleteParent}
            onArchiveParent={handleArchiveParent}
          />
        );
      case 'parent-profile':
        return (
          <ParentProfile
            parent={pageParams.parent}
            onBack={() => handleNavigate('parents-list')}
          />
        );

      // Timetable Module
      case 'timetable':
        return <TimetablePage />;
      case 'coding-playground':
        return <CodingPlayground />;

      // Attendance Module
      case 'attendance-daily':
        return <DailyAttendance learners={learners} />;
      case 'attendance-reports':
        return <AttendanceReports learners={learners} />;

      // Assessment Module
      case 'assess-mobile-dashboard':
        return (
          <MobileAssessmentsDashboard
            learners={learners}
            brandingSettings={brandingSettings}
            onNavigate={handleNavigate}
          />
        );
      case 'assess-formative':
        return <FormativeAssessment learners={learners} />;
      case 'assess-formative-report':
        return <FormativeReport learners={learners} brandingSettings={brandingSettings} user={user} />;
      case 'assess-summative-tests':
        return <SummativeTestsRouter onNavigate={handleNavigate} />;
      case 'assess-summative-assessment':
        return <SummativeAssessmentRouter learners={learners} initialTestId={pageParams.initialTestId} brandingSettings={brandingSettings} />;
      case 'assess-summative-report':
        return <SummativeReport learners={learners} onFetchLearners={fetchLearners} brandingSettings={brandingSettings} user={user} />;
      case 'assess-summary-report':
        return <SummaryReportPage />;
      case 'assess-termly-report':
        return <TermlyReport learners={learners} brandingSettings={brandingSettings} user={user} />;
      case 'assess-values':
        return <ValuesAssessment learners={learners} />;
      case 'assess-cocurricular':
        return <CoCurricularActivities learners={learners} />;
      case 'assess-core-competencies':
        return <CoreCompetenciesAssessment learners={learners} />;
      case 'assess-learning-areas':
        return <LearningAreasManagement />;
      case 'assess-performance-scale':
        return <PerformanceScale />;

      // Classes Module
      case 'classes':
        return <ClassList />;
      case 'create-class':
        return <CreateClassForm />;
      case 'class-detail':
        return <ClassDetailPage pageParams={pageParams} />;

      // Accounting Module
      case 'accounting-dashboard':
        return <AccountingManager user={user} />;
      case 'accounting-accounts':
        return <ChartOfAccounts />;
      case 'accounting-entries':
        return <JournalEntries />;
      case 'accounting-expenses':
        return <ExpenseManager />;
      case 'accounting-vendors':
        return <VendorManager />;
      case 'accounting-reconciliation':
        return <BankReconciliation />;
      case 'accounting-reports':
        return <FinancialReports />;

      // Facilities Module
      case 'facilities-classes':
        return <FacilityManager />;

      // Learning Hub Module (Placeholder)
      case 'learning-hub-materials':
      case 'learning-hub-assignments':
      case 'learning-hub-lesson-plans':
      case 'learning-hub-library':
        return <LearningHubPage />;

      // Communications Module
      case 'comm-notices':
        return <NoticesPage initialTab={pageParams.activeTab} />;
      case 'comm-messages':
        return <MessagesPage />;
      case 'comm-history':
        return <MessageHistoryPage />;

      // Inventory Module
      case 'inventory-items':
        return <InventoryItems />;
      case 'inventory-categories':
        return <InventoryCategories />;
      case 'inventory-stores':
        return <InventoryStores />;
      case 'inventory-movements':
        return <StockMovements />;
      case 'inventory-requisitions':
        return <StockRequisitions />;
      case 'inventory-transfers':
        return <StockTransfers />;
      case 'inventory-adjustments':
        return <StockAdjustments />;
      case 'inventory-assets':
        return <AssetRegister />;
      case 'inventory-class-assignments':
        return <AssetAssignments />;

      // Documents Module
      case 'docs-center':
        return <DocumentCenter />;
      case 'knowledge-base':
        return <KnowledgeBase />;

      // Fee Management Module
      case 'fees-structure':
        return <FeeStructurePage />;
      case 'fees-collection':
        return <FeeCollectionPage learnerId={pageParams.learnerId} />;
      case 'fees-reports':
        return <FeeReportsPage />;
      case 'fees-statements':
        return <StudentStatementsPage />;

      // Help Module
      case 'help':
        return <SupportHub />;

      // HR Module
      case 'hr-portal':
        return <HRManager onNavigate={handleNavigate} />;
      case 'hr-staff-profiles':
        return <StaffDirectory />;
      case 'hr-leave':
        return <LeaveManager />;
      case 'hr-payroll':
        return <PayrollManager />;
      case 'hr-documents':
        return <StaffDocuments />;
      case 'hr-performance':
        return <PerformanceManager />;

      // Settings Module
      case 'settings-school':
        return <SchoolSettings brandingSettings={brandingSettings} setBrandingSettings={setBrandingSettings} />;
      case 'settings-academic':
        return <AcademicSettings />;
      case 'settings-users':
        return <UserManagement />;
      case 'settings-branding':
        return <BrandingSettings brandingSettings={brandingSettings} setBrandingSettings={setBrandingSettings} />;
      case 'settings-backup':
        return <BackupSettings />;
      case 'settings-communication':
        return <CommunicationSettings />;
      case 'settings-payment':
        return <PaymentSettings />;

      default:
        return (
          <EmptyState
            title={PAGE_TITLES[currentPage] || 'Page'}
            message="This page is under development and will be available soon."
            actionText="Return to Dashboard"
            onAction={() => setCurrentPage('dashboard')}
          />
        );
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex h-screen bg-gray-50 text-gray-900 transition-colors duration-300">
          {/* Sidebar */}
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            brandingSettings={brandingSettings}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header
              user={user}
              onLogout={handleLogout}
              brandingSettings={brandingSettings}
              title={PAGE_TITLES[currentPage]}
              onNavigate={handleNavigate}
            />

            {/* Page Content */}
            <main
              ref={mainContentRef}
              onScroll={handleScroll}
              className="flex-1 overflow-auto p-6 custom-scrollbar"
            >
              <div className="max-w-screen-2xl mx-auto">
                <Suspense fallback={<LoadingOverlay />}>
                  {renderPage()}
                </Suspense>
              </div>
            </main>
          </div>

          {/* Toast Notification */}
          <Toast
            show={showToast}
            message={toastMessage}
            type={toastType}
            onClose={hideNotification}
          />

          {/* Add/Edit Parent Modal */}
          <AddEditParentModal
            show={showParentModal}
            onClose={() => {
              setShowParentModal(false);
              setEditingParent(null);
            }}
            onSave={handleSaveParent}
            parent={editingParent}
            learners={learners}
          />

          {/* Confirmation Dialog */}
          <ConfirmDialog
            show={showConfirmDialog}
            title="Confirm Action"
            message={
              currentPage === 'dashboard' && confirmAction
                ? "Are you sure you want to logout?"
                : "Are you sure you want to proceed with this action?"
            }
            confirmText="Confirm"
            cancelText="Cancel"
            onConfirm={() => confirmAction && confirmAction()}
            onCancel={() => setShowConfirmDialog(false)}
          />
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <>
          <MobileAppShell
            user={user}
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
            currentPage={currentPage}
            brandingSettings={brandingSettings}
          >
            <Suspense fallback={<LoadingOverlay />}>
              {/* Don't render page content inside shell when showing the full-screen assessment dashboard */}
              {currentPage !== 'assess-mobile-dashboard' && renderPage()}
            </Suspense>

            {/* Toast Notification */}
            <Toast
              show={showToast}
              message={toastMessage}
              type={toastType}
              onClose={hideNotification}
            />

            {/* Confirmation Dialog */}
            <ConfirmDialog
              show={showConfirmDialog}
              title="Confirm Action"
              message={
                currentPage === 'dashboard' && confirmAction
                  ? "Are you sure you want to logout?"
                  : "Are you sure you want to proceed with this action?"
              }
              confirmText="Confirm"
              cancelText="Cancel"
              onConfirm={() => confirmAction && confirmAction()}
              onCancel={() => setShowConfirmDialog(false)}
            />
          </MobileAppShell>

          {/* Assessment Dashboard: renders outside MobileAppShell to avoid overflow:hidden clipping */}
          {currentPage === 'assess-mobile-dashboard' && (
            <Suspense fallback={<LoadingOverlay />}>
              <MobileAssessmentsDashboard
                learners={learners}
                brandingSettings={brandingSettings}
                onNavigate={setCurrentPage}
                onBack={() => setCurrentPage('dashboard')}
              />
            </Suspense>
          )}
        </>
      )}
    </>
  );
}
