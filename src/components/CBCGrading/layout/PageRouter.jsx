import React, { lazy, Suspense } from 'react';
import ErrorBoundary from '../shared/ErrorBoundary';
import EmptyState from '../shared/EmptyState';
import ComingSoon from '../shared/ComingSoon';

// Lazy load page components
const RoleDashboard = lazy(() => import('../pages/dashboard/RoleDashboard'));
const LearnersList = lazy(() => import('../pages/LearnersList'));
const TeachersList = lazy(() => import('../pages/TeachersList'));
const AddEditTeacherPage = lazy(() => import('../pages/AddEditTeacherPage'));
const ParentsList = lazy(() => import('../pages/ParentsList'));
const LearningHubPage = lazy(() => import('../pages/LearningHubPage'));
const PromotionPage = lazy(() => import('../pages/PromotionPage'));
const TransferOutPage = lazy(() => import('../pages/TransferOutPage'));
const DailyAttendance = lazy(() => import('../pages/DailyAttendanceAPI'));
const AttendanceReports = lazy(() => import('../pages/AttendanceReports'));
const AdmissionsPage = lazy(() => import('../pages/AdmissionsPage'));
const TransfersInPage = lazy(() => import('../pages/TransfersInPage'));
const ExitedLearnersPage = lazy(() => import('../pages/ExitedLearnersPage'));
const FormativeAssessment = lazy(() => import('../pages/FormativeAssessment'));
const FormativeReport = lazy(() => import('../pages/FormativeReport'));
const MobileAssessmentsDashboard = lazy(() => import('../pages/MobileAssessmentsDashboard'));
const SummativeTestsRouter = lazy(() => import('../pages/SummativeTestsRouter'));
const SummativeAssessmentRouter = lazy(() => import('../pages/SummativeAssessmentRouter'));
const SummativeReport = lazy(() => import('../pages/SummativeReport'));
const TermlyReport = lazy(() => import('../pages/TermlyReport'));
const ValuesAssessment = lazy(() => import('../pages/ValuesAssessment'));
const CoCurricularActivities = lazy(() => import('../pages/CoCurricularActivities'));
const CoreCompetenciesAssessment = lazy(() => import('../pages/CoreCompetenciesAssessment'));
const SummaryReportPage = lazy(() => import('../pages/reports/SummaryReportPage'));
const PerformanceScale = lazy(() => import('../pages/PerformanceScale'));
const LearningAreasManagement = lazy(() => import('../pages/LearningAreasManagement'));
const FacilityManager = lazy(() => import('../pages/FacilityManager'));
const NoticesPage = lazy(() => import('../pages/NoticesPage'));
const MessagesPage = lazy(() => import('../pages/MessagesPage'));
const MessageHistoryPage = lazy(() => import('../pages/MessageHistoryPage'));
const SupportHub = lazy(() => import('../pages/SupportHub'));
const TimetablePage = lazy(() => import('../pages/TimetablePage'));
const CodingPlayground = lazy(() => import('../pages/CodingPlayground'));
const ClassList = lazy(() => import('../pages/ClassList'));
const CreateClassForm = lazy(() => import('../pages/CreateClassForm'));
const ClassDetailPage = lazy(() => import('../pages/ClassDetailPage'));
const SchoolSettings = lazy(() => import('../pages/settings/SchoolSettings'));
const AcademicSettings = lazy(() => import('../pages/settings/AcademicSettings'));
const UserManagement = lazy(() => import('../pages/settings/UserManagement'));
const BrandingSettings = lazy(() => import('../pages/settings/BrandingSettings'));
const BackupSettings = lazy(() => import('../pages/settings/BackupSettings'));
const CommunicationSettings = lazy(() => import('../pages/settings/CommunicationSettings'));
const PaymentSettings = lazy(() => import('../pages/settings/PaymentSettings'));
const IDCardTemplatesDesigner = lazy(() => import('../pages/settings/IDCardTemplatesDesigner'));
const FeeCollectionPage = lazy(() => import('../pages/FeeCollectionPage'));
const FeeStructurePage = lazy(() => import('../pages/FeeStructurePage'));
const FeeReportsPage = lazy(() => import('../pages/FeeReportsPage'));
const StudentStatementsPage = lazy(() => import('../pages/StudentStatementsPage'));
const DocumentCenter = lazy(() => import('../pages/DocumentCenter'));
const LearnerProfile = lazy(() => import('../pages/profiles/LearnerProfile'));
const TeacherProfile = lazy(() => import('../pages/profiles/TeacherProfile'));
const ParentProfile = lazy(() => import('../pages/profiles/ParentProfile'));
const PlannerLayout = lazy(() => import('../pages/planner/PlannerLayout'));
const UniformAllocationPage = lazy(() => import('../pages/UniformAllocationPage'));
const IDPrintingPage = lazy(() => import('../pages/IDPrintingPage'));

// HR Module
const HRManager = lazy(() => import('../pages/hr/HRManager'));
const StaffDirectory = lazy(() => import('../pages/hr/StaffDirectory'));
const LeaveManager = lazy(() => import('../pages/hr/LeaveManager'));
const PayrollManager = lazy(() => import('../pages/hr/PayrollManager'));
const StaffDocuments = lazy(() => import('../pages/hr/StaffDocuments'));
const PerformanceManager = lazy(() => import('../pages/hr/PerformanceManager'));

// Accounting Module
const AccountingManager = lazy(() => import('../pages/accounting/AccountingManager'));
const ChartOfAccounts = lazy(() => import('../pages/accounting/ChartOfAccounts'));
const JournalEntries = lazy(() => import('../pages/accounting/JournalEntries'));
const ExpenseManager = lazy(() => import('../pages/accounting/ExpenseManager'));
const VendorManager = lazy(() => import('../pages/accounting/VendorManager'));
const BankReconciliation = lazy(() => import('../pages/accounting/BankReconciliation'));
const FinancialReports = lazy(() => import('../pages/accounting/FinancialReports'));

// Inventory Module
const InventoryItems = lazy(() => import('../pages/inventory/InventoryItems'));
const InventoryCategories = lazy(() => import('../pages/inventory/InventoryCategories'));
const InventoryStores = lazy(() => import('../pages/inventory/InventoryStores'));
const StockMovements = lazy(() => import('../pages/inventory/StockMovements'));
const StockRequisitions = lazy(() => import('../pages/inventory/StockRequisitions'));
const StockTransfers = lazy(() => import('../pages/inventory/StockTransfers'));
const StockAdjustments = lazy(() => import('../pages/inventory/StockAdjustments'));
const AssetRegister = lazy(() => import('../pages/inventory/AssetRegister'));
const AssetAssignments = lazy(() => import('../pages/inventory/AssetAssignments'));
// Transport and Biometrics Modules
const TransportManager = lazy(() => import('../pages/transport/TransportManager'));
const LibraryManager = lazy(() => import('../pages/library/LibraryManager'));
const BiometricManager = lazy(() => import('../pages/biometric/BiometricManager'));

// LMS Module
const LMSManager = lazy(() => import('../pages/LMSManager'));
const LMSAssignments = lazy(() => import('../pages/lms/LMSAssignments'));

// Student Portal
const StudentDashboard = lazy(() => import('../pages/student/StudentDashboard'));
const MyCourses = lazy(() => import('../pages/student/MyCourses'));
const CourseViewer = lazy(() => import('../pages/student/CourseViewer'));
const MyAssignments = lazy(() => import('../pages/student/MyAssignments'));
const MyProgress = lazy(() => import('../pages/student/MyProgress'));

const LoadingOverlay = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
    <div className="w-16 h-16 border-4 border-[var(--brand-purple)]/20 border-t-[var(--brand-purple)] rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse tracking-wide uppercase">Optimizing Experience...</p>
  </div>
);

const PageRouter = ({
  currentPage,
  pageParams,
  user,
  learners,
  teachers,
  parents,
  pagination,
  teacherPagination,
  parentPagination,
  learnersLoading,
  brandingSettings,
  editingLearner,
  editingTeacher,
  handlers
}) => {
  const {
    handleNavigate,
    fetchLearners,
    handleAddLearner,
    handleEditLearner,
    handleViewLearner,
    handleMarkAsExited,
    handleDeleteLearner,
    handleBulkDeleteLearners,
    handleSaveLearner,
    setCurrentPage,
    setEditingLearner,
    handlePromoteLearners,
    handleTransferOut,
    fetchTeachers,
    handleAddTeacher,
    handleEditTeacher,
    handleViewTeacher,
    handleDeleteTeacher,
    handleSaveTeacher,
    setEditingTeacher,
    fetchParents,
    handleAddParent,
    handleEditParent,
    handleViewParent,
    handleDeleteParent,
    handleArchiveParent,
    handleSaveParent,
    showSuccess
  } = handlers;

  return (
    <Suspense fallback={<LoadingOverlay />}>
      {(() => {
        switch (currentPage) {
          case 'dashboard':
            return user?.role === 'STUDENT'
              ? <StudentDashboard user={user} onNavigate={handleNavigate} />
              : <RoleDashboard learners={learners} pagination={pagination} teachers={teachers} user={user} onNavigate={handleNavigate} />;

          // Planner Module
          case 'planner-calendar':
          case 'planner-timetable':
          case 'planner-agenda':
          case 'planner-schemes':
            return <PlannerLayout currentPage={currentPage} onNavigate={handleNavigate} />;

          // Learners Module
          case 'learners-list':
            return (
              <ErrorBoundary>
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
              </ErrorBoundary>
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
          case 'learners-transfers-in': return <TransfersInPage />;
          case 'learners-exited': return <ExitedLearnersPage />;
          case 'learners-promotion':
            return <PromotionPage learners={learners} onPromote={handlePromoteLearners} showNotification={showSuccess} />;
          case 'learners-transfer-out':
            return <TransferOutPage learners={learners} onTransferOut={handleTransferOut} showNotification={showSuccess} />;
          case 'learners-uniform': return <UniformAllocationPage />;
          case 'learners-id-print': return <IDPrintingPage />;

          case 'learner-profile':
            return <LearnerProfile learner={pageParams.learner} onBack={() => handleNavigate('learners-list')} brandingSettings={brandingSettings} onNavigate={handleNavigate} />;

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
            return <TeacherProfile teacher={pageParams.teacher} onBack={() => handleNavigate('teachers-list')} onEdit={handleEditTeacher} />;
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
            return <ParentProfile parent={pageParams.parent} onBack={() => handleNavigate('parents-list')} />;

          // Others
          case 'timetable': return <TimetablePage />;
          case 'coding-playground': return <CodingPlayground />;
          case 'attendance-daily': return <DailyAttendance learners={learners} />;
          case 'attendance-reports': return <AttendanceReports learners={learners} />;

          // Assessment Module
          case 'assess-mobile-dashboard':
            return <MobileAssessmentsDashboard learners={learners} brandingSettings={brandingSettings} onNavigate={handleNavigate} />;
          case 'assess-formative': return <ErrorBoundary><FormativeAssessment learners={learners} /></ErrorBoundary>;
          case 'assess-formative-report': return <ErrorBoundary><FormativeReport learners={learners} brandingSettings={brandingSettings} user={user} /></ErrorBoundary>;
          case 'assess-summative-tests': return <ErrorBoundary><SummativeTestsRouter onNavigate={handleNavigate} /></ErrorBoundary>;
          case 'assess-summative-assessment': return <ErrorBoundary><SummativeAssessmentRouter learners={learners} initialTestId={pageParams.initialTestId} brandingSettings={brandingSettings} /></ErrorBoundary>;
          case 'assess-summative-report': return <ErrorBoundary><SummativeReport learners={learners} onFetchLearners={fetchLearners} brandingSettings={brandingSettings} user={user} /></ErrorBoundary>;
          case 'assess-summary-report': return <ErrorBoundary><SummaryReportPage /></ErrorBoundary>;
          case 'assess-termly-report': return <ErrorBoundary><TermlyReport learners={learners} brandingSettings={brandingSettings} user={user} /></ErrorBoundary>;
          case 'assess-values': return <ValuesAssessment learners={learners} />;
          case 'assess-cocurricular': return <CoCurricularActivities learners={learners} />;
          case 'assess-core-competencies': return <CoreCompetenciesAssessment learners={learners} />;
          case 'assess-learning-areas': return <LearningAreasManagement />;
          case 'assess-performance-scale': return <PerformanceScale />;

          // Classes Module
          case 'classes': return <ClassList />;
          case 'create-class': return <CreateClassForm />;
          case 'class-detail': return <ClassDetailPage pageParams={pageParams} />;

          // Accounting Module
          case 'accounting-dashboard': return <AccountingManager user={user} />;
          case 'accounting-accounts': return <ChartOfAccounts />;
          case 'accounting-entries': return <JournalEntries />;
          case 'accounting-expenses': return <ExpenseManager />;
          case 'accounting-vendors': return <VendorManager />;
          case 'accounting-reconciliation': return <BankReconciliation />;
          case 'accounting-reports': return <FinancialReports />;

          case 'facilities-classes': return <FacilityManager />;
          case 'learning-hub-materials':
          case 'learning-hub-lesson-plans':
          case 'learning-hub-library':
            return <LearningHubPage />;
          case 'learning-hub-assignments':
            return <LMSAssignments />;
          
          // LMS Module
          case 'lms-courses': return <LMSManager currentPage={currentPage} />;
          case 'lms-content': return <LMSManager currentPage={currentPage} />;
          case 'lms-enrollments': return <LMSManager currentPage={currentPage} />;
          case 'lms-progress': return <LMSManager currentPage={currentPage} />;
          case 'lms-reports': return <LMSManager currentPage={currentPage} />;

          // Student Portal
          case 'student-courses': return <ErrorBoundary><MyCourses onNavigate={handleNavigate} /></ErrorBoundary>;
          case 'student-assignments': return <ErrorBoundary><MyAssignments onNavigate={handleNavigate} /></ErrorBoundary>;
          case 'student-progress': return <ErrorBoundary><MyProgress onNavigate={handleNavigate} /></ErrorBoundary>;
          case 'student-course-view': return <ErrorBoundary><CourseViewer courseId={pageParams.courseId} onNavigate={handleNavigate} /></ErrorBoundary>;

          case 'library-catalog':
          case 'library-circulation':
          case 'library-fees':
          case 'library-inventory':
          case 'library-members':
            return <LibraryManager currentPage={currentPage} />;
          case 'transport-routes':
          case 'transport-tracking':
          case 'transport-drivers':
          case 'hostel-allocation':
          case 'hostel-fees':
          case 'transport-reports':
            return <TransportManager />;
          case 'biometric-devices':
          case 'biometric-enrollment':
          case 'biometric-logs':
          case 'biometric-reports':
          case 'biometric-api':
          case 'biometric-dashboard':
            return <BiometricManager />;

          case 'comm-notices': return <NoticesPage initialTab={pageParams.activeTab} />;
          case 'comm-messages': return <MessagesPage />;
          case 'comm-history': return <MessageHistoryPage />;

          case 'inventory-items': return <InventoryItems />;
          case 'inventory-categories': return <InventoryCategories />;
          case 'inventory-stores': return <InventoryStores />;
          case 'inventory-movements': return <StockMovements />;
          case 'inventory-requisitions': return <StockRequisitions />;
          case 'inventory-transfers': return <StockTransfers />;
          case 'inventory-adjustments': return <StockAdjustments />;
          case 'inventory-assets': return <AssetRegister />;
          case 'inventory-class-assignments': return <AssetAssignments />;

          case 'docs-center': return <DocumentCenter />;

          case 'fees-structure': return <FeeStructurePage />;
          case 'fees-collection': return <FeeCollectionPage learnerId={pageParams.learnerId} />;
          case 'fees-reports': return <FeeReportsPage />;
          case 'fees-statements': return <StudentStatementsPage />;

          case 'help': return <SupportHub />;

          case 'hr-portal': return <HRManager onNavigate={handleNavigate} />;
          case 'hr-staff-profiles': return <StaffDirectory />;
          case 'hr-leave': return <LeaveManager />;
          case 'hr-payroll': return <PayrollManager />;
          case 'hr-documents': return <StaffDocuments />;
          case 'hr-performance': return <PerformanceManager />;

          case 'settings-school': return <SchoolSettings brandingSettings={brandingSettings} setBrandingSettings={handlers.setBrandingSettings} />;
          case 'settings-academic': return <AcademicSettings />;
          case 'settings-users': return <UserManagement />;
          case 'settings-branding': return <BrandingSettings brandingSettings={brandingSettings} setBrandingSettings={handlers.setBrandingSettings} />;
          case 'settings-backup': return <BackupSettings />;
          case 'settings-communication': return <ErrorBoundary><CommunicationSettings /></ErrorBoundary>;
          case 'settings-payment': return <PaymentSettings />;
          case 'settings-id-templates': return <ErrorBoundary><IDCardTemplatesDesigner /></ErrorBoundary>;

          // ── Secondary School modules (placeholders) ───────────────────────────
          case 'sec-subjects':        return <ComingSoon badge="Secondary" title="Subject Management"   description="Set up and manage KCSE subjects, assign teachers and allocate lessons per form." />;
          case 'sec-form-groups':     return <ComingSoon badge="Secondary" title="Form Groups"           description="Configure Forms 1–4, streams, class teachers and capacities." />;
          case 'sec-schemes':         return <ComingSoon badge="Secondary" title="Schemes of Work"       description="Upload and manage termly schemes of work for each subject and form." />;
          case 'sec-mark-entry':      return <ComingSoon badge="Secondary" title="Mark Entry"            description="Enter and review continuous assessment and exam marks per subject." />;
          case 'sec-cats':            return <ComingSoon badge="Secondary" title="CATs"                  description="Create, administer and record Continuous Assessment Tests for each form." />;
          case 'sec-mid-term':        return <ComingSoon badge="Secondary" title="Mid-term Exams"        description="Record and manage mid-term examination marks." />;
          case 'sec-end-term':        return <ComingSoon badge="Secondary" title="End-term Exams"        description="Record end-term examination marks and compute mean grades." />;
          case 'sec-kcse-mock':       return <ComingSoon badge="Secondary" title="KCSE Mock"             description="Administer mock examinations and generate KNEC-style grade reports." />;
          case 'sec-mean-grades':     return <ComingSoon badge="Secondary" title="Mean Grades"           description="View mean grades per student, stream and form across all subjects." />;
          case 'sec-rankings':        return <ComingSoon badge="Secondary" title="Class Rankings"        description="Generate ranked performance lists by stream, form and subject." />;
          case 'sec-subject-analysis':return <ComingSoon badge="Secondary" title="Subject Analysis"      description="Analyse performance trends by subject, teacher and examination type." />;
          case 'sec-report-cards':    return <ComingSoon badge="Secondary" title="Report Cards"          description="Generate and download end-of-term report cards for all students." />;
          case 'sec-kcse-prediction': return <ComingSoon badge="Secondary" title="KCSE Prediction"       description="Predict KCSE mean grades based on accumulated internal assessment data." />;

          // ── Tertiary Institution modules (placeholders) ───────────────────────
          case 'tert-departments':    return <ComingSoon badge="Tertiary" title="Departments"            description="Create and manage academic departments and their heads." />;
          case 'tert-programs':       return <ComingSoon badge="Tertiary" title="Programs"               description="Define degree, diploma and certificate programmes offered." />;
          case 'tert-units':          return <ComingSoon badge="Tertiary" title="Unit Management"         description="Manage academic units (courses), credit hours and prerequisites." />;
          case 'tert-enrollment':     return <ComingSoon badge="Tertiary" title="Unit Enrollment"         description="Enroll students into units for the current semester." />;
          case 'tert-cats':           return <ComingSoon badge="Tertiary" title="CATs (30%)"              description="Record Continuous Assessment Test scores — 30% of the final grade." />;
          case 'tert-exams':          return <ComingSoon badge="Tertiary" title="Exams (70%)"             description="Record end-of-semester examination scores — 70% of the final grade." />;
          case 'tert-mark-entry':     return <ComingSoon badge="Tertiary" title="Mark Entry"             description="Enter and review unit marks for both CATs and final examinations." />;
          case 'tert-grade-sheet':    return <ComingSoon badge="Tertiary" title="Grade Sheets"            description="Generate official grade sheets per unit and per semester." />;
          case 'tert-unit-results':   return <ComingSoon badge="Tertiary" title="Unit Results"            description="View and publish results per unit for the current semester." />;
          case 'tert-gpa':            return <ComingSoon badge="Tertiary" title="GPA Calculator"          description="Compute semester GPA and cumulative GPA for all enrolled students." />;
          case 'tert-semester-report':return <ComingSoon badge="Tertiary" title="Semester Reports"        description="Generate and distribute end-of-semester academic progress reports." />;
          case 'tert-transcripts':    return <ComingSoon badge="Tertiary" title="Transcripts"             description="Generate official academic transcripts for students." />;
          case 'tert-classifications':return <ComingSoon badge="Tertiary" title="Degree Classification"   description="Compute degree classifications — First Class, Second Upper, Second Lower, Pass." />;
          case 'tert-clubs':          return <ComingSoon badge="Tertiary" title="Clubs & Societies"       description="Manage student clubs, societies and extra-curricular activities." />;
          case 'tert-clearance':      return <ComingSoon badge="Tertiary" title="Student Clearance"       description="Process student clearance before graduation or withdrawal." />;

          default:
            return (
              <EmptyState
                title="Application Portal"
                description="Use the sidebar to explore Zawadi SMS modules."
              />
            );
        }
      })()}
    </Suspense>
  );
};

export default PageRouter;
