/**
 * Sidebar Component
 * Navigation sidebar with collapsible sections
 * Role-based permission filtering - Tutors hidden from teachers
 * Focus mode: Only showing Students, Tutors, Parents, Assessment, and Settings
 */

import React, { useMemo, useState } from 'react';
import {
  Home, Menu, X, Users, Settings,
  TrendingUp, ChevronDown, GraduationCap, CheckSquare, MessageCircle, UserCheck, HelpCircle, Receipt,
  Users2, BookOpen, Truck, Fingerprint, Calendar,
  CreditCard, PieChart, Package, Building2, FileText, Zap, School, Boxes
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';

// Modules to focus on - others will be hidden
const focusModules = ['dashboard', 'communications', 'planner', 'learners', 'teachers', 'parents', 'assessment', 'learning-hub', 'timetable', 'attendance', 'docs-center', 'knowledge-base', 'facilities', 'settings', 'hr', 'finance', 'inventory'];

// Define all navigation sections with their required permissions
const allNavSections = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    items: [],
    permission: null // Always visible
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: MessageCircle,
    permission: null, // All roles can access communications
    items: [
      { id: 'comm-notices', label: 'Notices & Announcements', path: 'comm-notices', permission: null },
      { id: 'comm-messages', label: 'Messages', path: 'comm-messages', permission: 'VIEW_INBOX' },
      { id: 'comm-history', label: 'Message History', path: 'comm-history', permission: null }
    ]
  },
  {
    id: 'planner',
    label: 'Planner',
    icon: Calendar,
    permission: null,
    items: [
      { id: 'planner-calendar', label: 'Calendar', path: 'planner-calendar', permission: null },
      { id: 'planner-timetable', label: 'Timetable', path: 'planner-timetable', permission: 'ACCESS_TIMETABLE' },
    ]
  },
  {
    id: 'learners',
    label: 'Students',
    icon: Users,
    permission: null, // Section visible to TEACHER, ADMIN, etc.
    items: [
      { id: 'learners-list', label: 'Students List', path: 'learners-list', permission: 'VIEW_ALL_LEARNERS' },
      { id: 'learners-admissions', label: 'Admissions', path: 'learners-admissions', permission: 'CREATE_LEARNER' },
      { id: 'learners-promotion', label: 'Promotion', path: 'learners-promotion', permission: 'PROMOTE_LEARNER' }
    ]
  },
  {
    id: 'teachers',
    label: 'Tutors',
    icon: GraduationCap,
    permission: 'MANAGE_TEACHERS', // Only admins can manage teachers - HIDDEN FROM TEACHERS
    items: [
      { id: 'teachers-list', label: 'Tutors List', path: 'teachers-list', permission: 'MANAGE_TEACHERS' }
    ]
  },
  {
    id: 'parents',
    label: 'Parents',
    icon: UserCheck,
    permission: 'VIEW_ALL_USERS', // Teachers can view parents
    items: [
      { id: 'parents-list', label: 'Parents List', path: 'parents-list', permission: 'VIEW_ALL_USERS' }
    ]
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: TrendingUp,
    permission: 'ACCESS_ASSESSMENT_MODULE', // Only teachers, admins, head teachers
    items: [
      {
        id: 'group-summative',
        label: 'Summative',
        type: 'group',
        icon: Zap,
        items: [
          { id: 'assess-summative-assessment', label: 'Assessments', path: 'assess-summative-assessment', permission: 'ACCESS_ASSESSMENT_MODULE' },
          { id: 'assess-summative-report', label: 'Reports', path: 'assess-summative-report', permission: 'ACCESS_ASSESSMENT_MODULE' },
        ]
      },
      {
        id: 'group-formative',
        label: 'Formative',
        type: 'group',
        icon: CheckSquare,
        items: [
          { id: 'assess-formative', label: 'Assessments', path: 'assess-formative', permission: 'ACCESS_ASSESSMENT_MODULE' },
          { id: 'assess-formative-report', label: 'Reports', path: 'assess-formative-report', permission: 'ACCESS_ASSESSMENT_MODULE' },
        ]
      },
      {
        id: 'group-general',
        label: 'Configuration',
        type: 'group',
        icon: Settings,
        items: [
          { id: 'assess-learning-areas', label: 'Learning Areas', path: 'assess-learning-areas', permission: 'MANAGE_LEARNING_AREAS' },
          { id: 'assess-summative-tests', label: 'Tests', path: 'assess-summative-tests', permission: 'ACCESS_ASSESSMENT_MODULE' },
          { id: 'assess-performance-scale', label: 'Performance Scale', path: 'assess-performance-scale', permission: 'ACCESS_ASSESSMENT_MODULE' }
        ]
      }
    ]
  },
  {
    id: 'learning-hub',
    label: 'Learning Hub',
    icon: BookOpen,
    permission: 'ACCESS_LEARNING_HUB', // Accountants should not access this
    items: [
      { id: 'learning-hub-materials', label: 'Class Materials', path: 'learning-hub-materials', permission: null },
      { id: 'learning-hub-assignments', label: 'Assignments', path: 'learning-hub-assignments', permission: null },
      { id: 'learning-hub-lesson-plans', label: 'Lesson Plans', path: 'learning-hub-lesson-plans', permission: 'ACCESS_LEARNING_HUB' },
      { id: 'coding-playground', label: 'Coding Playground', path: 'coding-playground', permission: null },
      { id: 'learning-hub-library', label: 'Resource Library', path: 'learning-hub-library', permission: null }
    ]
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: Calendar,
    permission: 'ACCESS_TIMETABLE', // Accountants should not access this
    items: []
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: CheckSquare,
    permission: null, // Teachers can mark attendance
    items: [
      { id: 'attendance-daily', label: 'Daily Attendance', path: 'attendance-daily', permission: 'MARK_ATTENDANCE' },
      { id: 'attendance-reports', label: 'Attendance Reports', path: 'attendance-reports', permission: 'GENERATE_ATTENDANCE_REPORTS' }
    ]
  },
  {
    id: 'docs-center',
    label: 'Docs',
    icon: FileText,
    permission: null,
    items: []
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    icon: BookOpen,
    permission: null,
    items: []
  },

  {
    id: 'hr',
    label: 'HR',
    icon: Users2,
    permission: 'HR_MANAGEMENT', // Only admins and HR personnel
    items: [
      { id: 'hr-portal', label: 'HR Dashboard', path: 'hr-portal', permission: 'HR_MANAGEMENT' },
      { id: 'hr-staff-profiles', label: 'Staff Directory', path: 'hr-staff-profiles', permission: 'HR_MANAGEMENT' },
      { id: 'hr-payroll', label: 'Payroll Processing', path: 'hr-payroll', permission: 'HR_MANAGEMENT' },
      { id: 'hr-leave', label: 'Leave Management', path: 'hr-leave', permission: 'HR_MANAGEMENT' },
      { id: 'hr-documents', label: 'Staff Documents', path: 'hr-documents', permission: 'HR_MANAGEMENT' },
      { id: 'hr-performance', label: 'Performance', path: 'hr-performance', permission: 'HR_MANAGEMENT' }
    ]
  },
  {
    id: 'library',
    label: 'Library Management',
    icon: BookOpen,
    permission: 'LIBRARY_MANAGEMENT', // Admins and librarians
    items: [
      { id: 'library-catalog', label: 'Book Catalog', path: 'library-catalog', permission: 'LIBRARY_MANAGEMENT', comingSoon: true },
      { id: 'library-circulation', label: 'Borrow/Return Tracking', path: 'library-circulation', permission: 'LIBRARY_MANAGEMENT', comingSoon: true },
      { id: 'library-fees', label: 'Late Fee Automation', path: 'library-fees', permission: 'LIBRARY_MANAGEMENT', comingSoon: true },
      { id: 'library-inventory', label: 'Inventory Reports', path: 'library-inventory', permission: 'LIBRARY_MANAGEMENT', comingSoon: true },
      { id: 'library-members', label: 'Member Management', path: 'library-members', permission: 'LIBRARY_MANAGEMENT', comingSoon: true }
    ]
  },
  {
    id: 'transport',
    label: 'Transport & Hostel',
    icon: Truck,
    permission: 'TRANSPORT_MANAGEMENT', // Admins and transport managers
    items: [
      { id: 'transport-routes', label: 'Bus Routes & Roster', path: 'transport-routes', permission: 'TRANSPORT_MANAGEMENT', comingSoon: true },
      { id: 'transport-tracking', label: 'GPS Tracking', path: 'transport-tracking', permission: 'TRANSPORT_MANAGEMENT', comingSoon: true },
      { id: 'transport-drivers', label: 'Driver Management', path: 'transport-drivers', permission: 'TRANSPORT_MANAGEMENT', comingSoon: true },
      { id: 'hostel-allocation', label: 'Hostel Room Allocation', path: 'hostel-allocation', permission: 'TRANSPORT_MANAGEMENT', comingSoon: true },
      { id: 'hostel-fees', label: 'Transport/Hostel Fees', path: 'hostel-fees', permission: 'TRANSPORT_MANAGEMENT', comingSoon: true },
      { id: 'transport-reports', label: 'Transport Reports', path: 'transport-reports', permission: 'TRANSPORT_MANAGEMENT', comingSoon: true }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: CreditCard,
    permission: 'FEE_MANAGEMENT', // Access if can manage fees or accounting
    items: [
      {
        id: 'group-fees',
        label: 'Fee Management',
        type: 'group',
        icon: Receipt,
        permission: 'FEE_MANAGEMENT',
        items: [
          { id: 'fees-structure', label: 'Fee Structure', path: 'fees-structure', permission: 'FEE_MANAGEMENT' },
          { id: 'fees-collection', label: 'Fee Collection', path: 'fees-collection', permission: 'FEE_MANAGEMENT' },
          { id: 'fees-reports', label: 'Fee Reports', path: 'fees-reports', permission: 'FEE_MANAGEMENT' },
          { id: 'fees-statements', label: 'Student Statements', path: 'fees-statements', permission: 'FEE_MANAGEMENT' }
        ]
      },
      {
        id: 'group-accounting',
        label: 'Accounting',
        type: 'group',
        icon: PieChart,
        permission: 'ACCOUNTING_MANAGEMENT',
        items: [
          { id: 'accounting-dashboard', label: 'Accounting Dashboard', path: 'accounting-dashboard', permission: 'ACCOUNTING_MANAGEMENT' },
          { id: 'accounting-accounts', label: 'Chart of Accounts', path: 'accounting-accounts', permission: 'ACCOUNTING_MANAGEMENT' },
          { id: 'accounting-entries', label: 'Journal Entries', path: 'accounting-entries', permission: 'ACCOUNTING_MANAGEMENT' },
          { id: 'accounting-expenses', label: 'Expenses', path: 'accounting-expenses', permission: 'ACCOUNTING_MANAGEMENT' },
          { id: 'accounting-vendors', label: 'Vendors', path: 'accounting-vendors', permission: 'ACCOUNTING_MANAGEMENT' },
          { id: 'accounting-reconciliation', label: 'Reconciliation', path: 'accounting-reconciliation', permission: 'ACCOUNTING_MANAGEMENT' },
          { id: 'accounting-reports', label: 'Financial Reports', path: 'accounting-reports', permission: 'ACCOUNTING_MANAGEMENT' }
        ]
      }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    permission: 'SCHOOL_SETTINGS',
    items: [
      { id: 'inventory-items', label: 'Items', path: 'inventory-items', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-categories', label: 'Categories', path: 'inventory-categories', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-stores', label: 'Stores', path: 'inventory-stores', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-movements', label: 'Stock Movements', path: 'inventory-movements', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-requisitions', label: 'Requisitions', path: 'inventory-requisitions', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-transfers', label: 'Transfers', path: 'inventory-transfers', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-adjustments', label: 'Adjustments', path: 'inventory-adjustments', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-assets', label: 'Asset Register', path: 'inventory-assets', permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-class-assignments', label: 'Class Assignments', path: 'inventory-class-assignments', permission: 'SCHOOL_SETTINGS' }
    ]
  },
  {
    id: 'biometric',
    label: 'Biometric Attendance',
    icon: Fingerprint,
    permission: 'BIOMETRIC_ATTENDANCE', // Admins and attendance managers
    items: [
      { id: 'biometric-devices', label: 'Device Management', path: 'biometric-devices', permission: 'BIOMETRIC_ATTENDANCE', comingSoon: true },
      { id: 'biometric-enrollment', label: 'Fingerprint Enrollment', path: 'biometric-enrollment', permission: 'BIOMETRIC_ATTENDANCE', comingSoon: true },
      { id: 'biometric-logs', label: 'Attendance Logs', path: 'biometric-logs', permission: 'BIOMETRIC_ATTENDANCE', comingSoon: true },
      { id: 'biometric-reports', label: 'Biometric Reports', path: 'biometric-reports', permission: 'BIOMETRIC_ATTENDANCE', comingSoon: true },
      { id: 'biometric-api', label: 'API Integration', path: 'biometric-api', permission: 'BIOMETRIC_ATTENDANCE', comingSoon: true }
    ]
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    permission: null, // Always visible
    items: []
  },
  {
    id: 'facilities',
    label: 'Facilities',
    icon: Building2,
    permission: 'MANAGE_FACILITIES', // Head teachers can manage facilities
    items: [
      { id: 'facilities-classes', label: 'Classes & Streams', path: 'facilities-classes', permission: 'MANAGE_FACILITIES' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    permission: 'SCHOOL_SETTINGS', // Only ADMIN and SUPER_ADMIN
    items: [
      { id: 'settings-school', label: 'School Settings', path: 'settings-school', permission: 'SCHOOL_SETTINGS' },
      { id: 'settings-academic', label: 'Academic Settings', path: 'settings-academic', permission: 'ACADEMIC_SETTINGS' },
      { id: 'settings-communication', label: 'Communication Settings', path: 'settings-communication', permission: 'SCHOOL_SETTINGS' },
      { id: 'settings-payment', label: 'Payment Settings', path: 'settings-payment', permission: 'SCHOOL_SETTINGS' },
      { id: 'settings-users', label: 'User Management', path: 'settings-users', permission: 'EDIT_USER' },
      { id: 'settings-branding', label: 'Branding', path: 'settings-branding', permission: 'BRANDING_SETTINGS' },
      { id: 'settings-backup', label: 'Backup & Restore', path: 'settings-backup', permission: 'BACKUP_SETTINGS' }
    ]
  }
];

// Prefetch helper to speed up lazy loading
const prefetchModule = (path) => {
  if (!path || path.startsWith('http')) return;
  // This triggers the browser to start downloading the module chunk
  // before the user even clicks it.
  try {
    // 1. Check explicit fileMap first (High Priority)
    const fileMap = {
      'learners-list': 'LearnersList',
      'learners-admissions': 'AdmissionsPage',
      'learners-promotion': 'PromotionPage',
      'teachers-list': 'TeachersList',
      'parents-list': 'ParentsList',
      'assess-summative-assessment': 'SummativeAssessment',
      'assess-summative-report': 'SummativeReport',
      'assess-formative': 'FormativeAssessment',
      'assess-formative-report': 'FormativeReport',
      'assess-summative-tests': 'SummativeTests',
      'assess-performance-scale': 'PerformanceScale',
      'assess-learning-areas': 'LearningAreasManagement',
      'fees-collection': 'FeeCollectionPage',
      'fees-structure': 'FeeStructurePage',
      'fees-reports': 'FeeReportsPage',
      'fees-statements': 'StudentStatementsPage',
      'docs-center': 'DocumentCenter',
      'knowledge-base': 'KnowledgeBase',
      'coding-playground': 'CodingPlayground',
      'timetable': 'TimetablePage',
      'attendance-daily': 'DailyAttendanceAPI',
      'attendance-reports': 'AttendanceReports',
      'comm-notices': 'NoticesPage',
      'comm-messages': 'MessagesPage',
      'comm-history': 'MessageHistoryPage',
      'learning-hub-materials': 'LearningHubPage',
      'learning-hub-assignments': 'LearningHubPage',
      'learning-hub-lesson-plans': 'LearningHubPage',
      'learning-hub-library': 'LearningHubPage',
      'facilities-classes': 'FacilityManager',
      'help': 'SupportHub',
      // Inventory Module Mappings
      'inventory-items': 'inventory/InventoryItems',
      'inventory-categories': 'inventory/InventoryCategories',
      'inventory-stores': 'inventory/InventoryStores',
      'inventory-movements': 'inventory/StockMovements',
      'inventory-requisitions': 'inventory/StockRequisitions',
      'inventory-transfers': 'inventory/StockTransfers',
      'inventory-adjustments': 'inventory/StockAdjustments',
      'inventory-assets': 'inventory/AssetRegister',
      'inventory-class-assignments': 'inventory/AssetAssignments',
      // HR Module Mappings
      'hr-portal': 'hr/HRManager',
      'hr-staff-profiles': 'hr/StaffDirectory',
      'hr-leave': 'hr/LeaveManager',
      'hr-payroll': 'hr/PayrollManager',
      'hr-documents': 'hr/StaffDocuments',
      'hr-performance': 'hr/PerformanceManager',
      // Accounting Module Mappings
      'accounting-dashboard': 'accounting/AccountingManager',
      'accounting-accounts': 'accounting/ChartOfAccounts',
      'accounting-entries': 'accounting/JournalEntries',
      'accounting-expenses': 'accounting/ExpenseManager',
      'accounting-vendors': 'accounting/VendorManager',
      'accounting-reconciliation': 'accounting/BankReconciliation',
      'accounting-reports': 'accounting/FinancialReports'
    };

    if (fileMap[path]) {
      import(`../pages/${fileMap[path]}.jsx`);
      return;
    }

    // 2. Pattern based matching for settings
    if (path.startsWith('settings-')) {
      const settingsMap = {
        'settings-school': 'SchoolSettings',
        'settings-academic': 'AcademicSettings',
        'settings-communication': 'CommunicationSettings',
        'settings-payment': 'PaymentSettings',
        'settings-users': 'UserManagement',
        'settings-branding': 'BrandingSettings',
        'settings-backup': 'BackupSettings'
      };
      const fileName = settingsMap[path];
      if (fileName) {
        import(`../pages/settings/${fileName}.jsx`);
      }
    }
    // 3. Pattern based matching for profiles (Must be specific to avoid hr-staff-profiles)
    else if (path.endsWith('-profile') && !path.startsWith('hr-')) {
      const name = path.replace('-profile', '');
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1) + 'Profile';
      import(`../pages/profiles/${capitalized}.jsx`);
    }
    else if (path === 'dashboard') {
      import('../pages/dashboard/RoleDashboard.jsx');
    }
    else {
      // Fallback
      const fileName = path.charAt(0).toUpperCase() + path.slice(1);
      import(`../pages/${fileName}.jsx`);
    }
  } catch (e) {
    // Fail silently, prefetching is a non-critical optimization
  }
};

// Helper to find the first navigable path in a section
const findDefaultPath = (items) => {
  for (const item of items) {
    if (item.type === 'group') {
      const path = findDefaultPath(item.items);
      if (path) return path;
    } else {
      if (!item.comingSoon && !item.greyedOut && item.path) {
        return item.path;
      }
    }
  }
  return null;
};

const Sidebar = React.memo(({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  onNavigate,
  expandedSections,
  toggleSection,
  brandingSettings
}) => {
  const { can, role } = usePermissions();
  const [expandedSubSections, setExpandedSubSections] = useState({
    'group-summative': true,
    'group-formative': false,
    'group-general': true
  });

  const toggleSubSection = (id) => {
    setExpandedSubSections(prev => {
      const isOpening = !prev[id];
      if (isOpening) {
        // Close all other sub-sections
        const newState = Object.keys(prev).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        newState[id] = true;
        return newState;
      } else {
        // Just toggling off
        return { ...prev, [id]: false };
      }
    });
  };

  // Auto-expand group if one of its children is the current page
  React.useEffect(() => {
    // Check all sections for groups with active children
    allNavSections.forEach(section => {
      if (section.items && section.items.length > 0) {
        section.items.forEach(item => {
          if (item.type === 'group') {
            const isChildActive = item.items.some(subItem => subItem.path === currentPage);
            if (isChildActive) {
              setExpandedSubSections(prev => ({
                ...prev,
                [item.id]: true
              }));
            }
          }
        });
      }
    });
  }, [currentPage]);

  // Filter navigation sections based on user permissions AND focus modules
  const navSections = useMemo(() => {
    const isItemVisible = (item) => !item.permission || can(item.permission);

    const processItems = (items) => {
      return items.reduce((acc, item) => {
        if (item.type === 'group') {
          const visibleChildren = item.items.filter(isItemVisible);
          if (visibleChildren.length > 0) {
            acc.push({ ...item, items: visibleChildren });
          }
        } else {
          if (isItemVisible(item)) {
            acc.push(item);
          }
        }
        return acc;
      }, []);
    };

    return allNavSections.filter(section => {
      // First check if this section is in our focus modules
      if (!focusModules.includes(section.id)) {
        return false; // Hide non-focus modules
      }

      // Settings is handled separately at the bottom
      if (section.id === 'settings') {
        return false;
      }

      // If section has permission requirement, check it
      if (section.permission && !can(section.permission)) {
        return false;
      }
      // If no permission required on section, check if any items are visible
      if (section.items.length > 0) {
        const visibleItems = processItems(section.items);
        return visibleItems.length > 0;
      }
      // Section with no items and no permission - always visible
      return true;
    })
      .map(section => ({
        ...section,
        items: processItems(section.items)
      }));
  }, [can]);

  // Find settings section separately
  const settingsSection = useMemo(() => {
    // Teachers and HoC/Head Teachers may have different access
    if (role === 'TEACHER') return null;
    // HoC should have access to settings if they have the permission
    const section = allNavSections.find(s => s.id === 'settings');
    if (!section || !can(section.permission)) return null;

    const isItemVisible = (item) => !item.permission || can(item.permission);
    return {
      ...section,
      items: section.items.filter(isItemVisible)
    };
  }, [can, role]);

  // Group sections
  const educationSections = useMemo(() => {
    // For teachers, show only Students and Assessment
    if (role === 'TEACHER') {
      return navSections.filter(s => ['learners', 'assessment'].includes(s.id));
    }
    // For accountants, hide Learning Hub and Timetable
    if (role === 'ACCOUNTANT') {
      return navSections.filter(s =>
        !['learning-hub', 'timetable'].includes(s.id) &&
        ['learners', 'assessment', 'attendance'].includes(s.id)
      );
    }
    // For other roles, show all education sections
    return navSections.filter(s =>
      ['learners', 'teachers', 'parents', 'assessment', 'learning-hub', 'timetable', 'attendance'].includes(s.id)
    );
  }, [navSections, role]);

  const sharedSections = useMemo(() => {
    // Teachers don't see shared utilities
    if (role === 'TEACHER') return [];
    return navSections.filter(s =>
      ['docs-center', 'knowledge-base'].includes(s.id)
    );
  }, [navSections, role]);

  const schoolSections = useMemo(() => {
    // Teachers don't see school management sections
    if (role === 'TEACHER') return [];
    return navSections.filter(s =>
      ['hr', 'finance', 'inventory', 'library', 'transport', 'biometric'].includes(s.id)
    );
  }, [navSections, role]);

  const facilitiesSections = useMemo(() => {
    // Teachers don't see facilities
    if (role === 'TEACHER') return [];
    return navSections.filter(s => s.id === 'facilities');
  }, [navSections, role]);

  const dashboardSection = navSections.find(s => s.id === 'dashboard');

  // For teachers, filter communications to only show Inbox (Messages)
  const communicationSection = useMemo(() => {
    const section = navSections.find(s => s.id === 'communications');
    if (!section) return null;

    if (role === 'TEACHER') {
      return {
        ...section,
        items: section.items.filter(item => item.id === 'comm-messages')
      };
    }

    return section;
  }, [navSections, role]);

  // Hide help section for teachers
  const helpSection = useMemo(() => {
    if (role === 'TEACHER') return null;
    return navSections.find(s => s.id === 'help');
  }, [navSections, role]);

  const handleSectionClick = (section) => {
    if (sidebarOpen) {
      toggleSection(section.id);
    } else {
      // If sidebar is collapsed, navigate to the first available item in the section
      const defaultPath = findDefaultPath(section.items);
      if (defaultPath) {
        onNavigate(defaultPath);
      } else {
        // If no path found (e.g. all items hidden or coming soon), expand sidebar to show options
        setSidebarOpen(true);
        toggleSection(section.id);
      }
    }
  };

  const [activeCategory, setActiveCategory] = useState(() => {
    const learningRoles = ['TEACHER', 'PARENT'];
    const schoolRoles = ['ACCOUNTANT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'];
    if (learningRoles.includes(role)) return 'learning';
    if (schoolRoles.includes(role)) return 'school';
    return 'learning';
  });

  const toggleCategory = (category) => {
    setActiveCategory(prev => prev === category ? null : category);
  };

  // Auto-expand category based on current page
  React.useEffect(() => {
    const isSchool = schoolSections.some(s =>
      s.id === currentPage || s.items.some(i => i.path === currentPage)
    );
    const isUtilities = sharedSections.some(s =>
      s.id === currentPage || s.items.some(i => i.path === currentPage)
    );

    if (isSchool) setActiveCategory('school');
    else if (isUtilities) setActiveCategory('utilities');
    else if (currentPage === 'settings-school' || currentPage.startsWith('settings-')) setActiveCategory('settings');
  }, [currentPage, schoolSections, sharedSections]);

  return (
    <div className={`${sidebarOpen ? 'w-52' : 'w-20'} bg-[#5D0057] dark:bg-slate-900 text-white transition-all duration-300 flex flex-col border-r border-white/10 dark:border-slate-800 shadow-lg`}>
      {/* Logo/Brand with Premium Styling */}
      <div className="h-20 p-5 border-b border-white/10 dark:border-slate-800 bg-[#520050] dark:bg-slate-950 relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 opacity-0"></div>

        <div className="flex items-center gap-3 justify-center overflow-hidden relative z-10">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-white tracking-widest truncate w-full text-center hover:drop-shadow-lg transition-shadow duration-300">
              {brandingSettings?.schoolName || 'ZAWADI JUNIOR ACADEMY'}
            </h1>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0 border border-white/10 hover:border-brand-purple/50 transition-all duration-300 shadow-lg">
              <span className="text-lg font-bold text-white">
                {(brandingSettings?.schoolName || 'EL').substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 bg-[#5D0057] dark:bg-slate-900 custom-scrollbar space-y-2">
        <div className="space-y-3">
          {/* Dashboard */}
          {dashboardSection && (
            <div key={dashboardSection.id}>
              <button
                onClick={() => onNavigate(dashboardSection.id)}
                onMouseEnter={() => prefetchModule(dashboardSection.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${currentPage === dashboardSection.id
                  ? 'bg-brand-teal/40 text-white border border-brand-teal/50 shadow-lg shadow-brand-teal/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
              >
                {currentPage === dashboardSection.id && (
                  <div className="absolute inset-0 opacity-0"></div>
                )}
                <div className="min-w-[20px] flex justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <dashboardSection.icon size={20} />
                </div>
                {sidebarOpen && <span className="text-sm font-bold tracking-tight relative z-10">{dashboardSection.label}</span>}
              </button>
            </div>
          )}


          {/* Communications */}
          {communicationSection && (
            <div key={communicationSection.id}>
              <NavSection
                section={communicationSection}
                expandedSections={expandedSections}
                handleSectionClick={handleSectionClick}
                sidebarOpen={sidebarOpen}
                expandedSubSections={expandedSubSections}
                toggleSubSection={toggleSubSection}
                currentPage={currentPage}
                onNavigate={onNavigate}
              />
            </div>
          )}

          {/* Learning */}
          {educationSections.length > 0 && (
            <div className="space-y-1">
              {educationSections.map(section => (
                <NavSection
                  key={section.id}
                  section={section}
                  expandedSections={expandedSections}
                  handleSectionClick={handleSectionClick}
                  sidebarOpen={sidebarOpen}
                  expandedSubSections={expandedSubSections}
                  toggleSubSection={toggleSubSection}
                  currentPage={currentPage}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}

          {/* Back Office */}
          {schoolSections.length > 0 && (
            <div className="space-y-1">
              {sidebarOpen && (
                <button
                  onClick={() => toggleCategory('school')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-200 transition-all duration-300 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-[20px] flex justify-center group-hover:scale-110 transition-transform">
                      <School size={18} className="opacity-70 group-hover:opacity-100" />
                    </div>
                    <span className="uppercase tracking-wider font-bold text-brand-teal">Back Office</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeCategory === 'school' ? 'rotate-180' : ''}`} />
                </button>
              )}
              {(!sidebarOpen || activeCategory === 'school') && (
                <div className={sidebarOpen ? "animate-in fade-in slide-in-from-top-1 duration-200" : ""}>
                  {schoolSections.map(section => (
                    <NavSection
                      key={section.id}
                      section={section}
                      expandedSections={expandedSections}
                      handleSectionClick={handleSectionClick}
                      sidebarOpen={sidebarOpen}
                      expandedSubSections={expandedSubSections}
                      toggleSubSection={toggleSubSection}
                      currentPage={currentPage}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Facilities - Direct Items */}
          {facilitiesSections.length > 0 && (
            <div className="space-y-1">
              {facilitiesSections.map(section => (
                <NavSection
                  key={section.id}
                  section={section}
                  expandedSections={expandedSections}
                  handleSectionClick={handleSectionClick}
                  sidebarOpen={sidebarOpen}
                  expandedSubSections={expandedSubSections}
                  toggleSubSection={toggleSubSection}
                  currentPage={currentPage}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}

          {/* Utilities */}
          {sharedSections.length > 0 && (
            <div className="space-y-1">
              {sidebarOpen && (
                <button
                  onClick={() => toggleCategory('utilities')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-200 transition-all duration-300 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-[20px] flex justify-center group-hover:scale-110 transition-transform">
                      <Boxes size={18} className="opacity-70 group-hover:opacity-100" />
                    </div>
                    <span className="uppercase tracking-wider font-semibold">Utilities</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeCategory === 'utilities' ? 'rotate-180' : ''}`} />
                </button>
              )}
              {(!sidebarOpen || activeCategory === 'utilities') && (
                <div className={sidebarOpen ? "animate-in fade-in slide-in-from-top-1 duration-200" : ""}>
                  {sharedSections.map(section => (
                    <NavSection
                      key={section.id}
                      section={section}
                      expandedSections={expandedSections}
                      handleSectionClick={handleSectionClick}
                      sidebarOpen={sidebarOpen}
                      expandedSubSections={expandedSubSections}
                      toggleSubSection={toggleSubSection}
                      currentPage={currentPage}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Help & Support */}
          {helpSection && (
            <div key={helpSection.id} className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => onNavigate(helpSection.id)}
                onMouseEnter={() => prefetchModule(helpSection.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${currentPage === helpSection.id
                  ? 'bg-cyan-500/30 text-white border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
              >
                <div className="min-w-[20px] flex justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <helpSection.icon size={20} />
                </div>
                {sidebarOpen && <span className="text-sm font-bold tracking-tight relative z-10">{helpSection.label}</span>}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Settings (Admin Only) */}
      <div className="p-3 border-t border-white/10 bg-[#520050]">
        {settingsSection && (
          <div className="mb-2">
            <NavSection
              section={settingsSection}
              expandedSections={expandedSections}
              handleSectionClick={handleSectionClick}
              sidebarOpen={sidebarOpen}
              expandedSubSections={expandedSubSections}
              toggleSubSection={toggleSubSection}
              currentPage={currentPage}
              onNavigate={onNavigate}
              isBottom={true}
            />
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition text-gray-400 hover:bg-[#0D9488] hover:text-white"
        >
          {sidebarOpen ? (
            <>
              <X size={20} />
              <span className="text-sm font-medium">Collapse Menu</span>
            </>
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>
    </div>
  );
});

// Helper component to avoid repetition
const NavSection = React.memo(({
  section,
  expandedSections,
  handleSectionClick,
  sidebarOpen,
  expandedSubSections,
  toggleSubSection,
  currentPage,
  onNavigate,
  isBottom = false
}) => {
  return (
    <div key={section.id}>
      {section.items.length > 0 ? (
        <>
          <button
            onClick={() => handleSectionClick(section)}
            onMouseEnter={() => {
              // Only prefetch first item if collapsed
              if (!sidebarOpen) {
                const defaultPath = findDefaultPath(section.items);
                if (defaultPath) prefetchModule(defaultPath);
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${section.id === 'assessment'
              ? (expandedSections[section.id] ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10' : 'text-amber-400 hover:bg-white/5 hover:text-amber-300 border border-transparent hover:border-amber-500/30')
              : (expandedSections[section.id] ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10')
              }`}
          >
            {expandedSections[section.id] && (
              <div className="absolute inset-0 opacity-0"></div>
            )}
            <div className="flex items-center gap-3 flex-1 relative z-10">
              <div className="min-w-[20px] flex justify-center group-hover:scale-110 transition-transform duration-300">
                <section.icon size={20} className={section.id === 'assessment' ? 'text-amber-400' : ''} />
              </div>
              {sidebarOpen && <span className="text-sm font-bold tracking-tight">{section.label}</span>}
            </div>
            {sidebarOpen && (
              <ChevronDown
                size={16}
                className={`transition duration-300 ${expandedSections[section.id] ? 'rotate-180' : ''} opacity-70 group-hover:opacity-100`}
              />
            )}
          </button>
          {expandedSections[section.id] && sidebarOpen && (
            <div className={`ml-6 space-y-0.5 mt-1 border-l border-white/10 ${isBottom ? 'mb-2' : ''}`}>
              {section.items.map((item) => {
                if (item.type === 'group') {
                  // Check if any child item matches current page
                  const isGroupActive = item.items.some(subItem => subItem.path === currentPage);

                  return (
                    <div key={item.id} className="mt-2 mb-1">
                      <button
                        onClick={() => item.greyedOut ? null : toggleSubSection(item.id)}
                        disabled={item.greyedOut}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium transition-colors ${item.greyedOut
                          ? 'text-gray-600 opacity-50 cursor-not-allowed'
                          : (isGroupActive
                            ? 'text-[#0D9488] bg-white/5 rounded-md'
                            : 'text-gray-500 hover:text-gray-300')
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon size={12} className={item.greyedOut ? 'opacity-40' : (isGroupActive ? 'text-[#0D9488]' : 'opacity-70')} />}
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown size={10} className={`transition-transform duration-200 opacity-50 ${expandedSubSections[item.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedSubSections[item.id] && (
                        <div className="space-y-0.5 ml-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          {item.items.map(subItem => (
                            <button
                              key={subItem.id}
                              onClick={() => (subItem.comingSoon || subItem.greyedOut) ? null : onNavigate(subItem.path)}
                              onMouseEnter={() => prefetchModule(subItem.path)}
                              className={`w-full text-left px-3 py-1.5 rounded-r-md text-sm transition flex items-center justify-between ${subItem.comingSoon || subItem.greyedOut
                                ? 'text-gray-600 cursor-not-allowed'
                                : (currentPage === subItem.path
                                  ? 'bg-white/5 text-[#0D9488] font-medium border-l-2 border-[#0D9488]'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent')
                                }`}
                              disabled={subItem.comingSoon || subItem.greyedOut}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-gray-500 flex-shrink-0">—</span>
                                <span className="truncate">{subItem.label}</span>
                              </div>
                              {subItem.comingSoon && (
                                <span className="text-[8px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-medium uppercase border border-[#F59E0B]/30 flex-shrink-0">
                                  Soon
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => (item.comingSoon || item.greyedOut) ? null : onNavigate(item.path)}
                    onMouseEnter={() => prefetchModule(item.path)}
                    className={`w-full text-left px-3 py-1.5 rounded-r-md text-sm transition flex items-center justify-between ${item.comingSoon || item.greyedOut
                      ? 'text-gray-600 cursor-not-allowed'
                      : (currentPage === item.path
                        ? 'bg-white/5 text-[#0D9488] font-medium border-l-2 border-[#0D9488]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent')
                      }`}
                    disabled={item.comingSoon || item.greyedOut}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.comingSoon && (
                      <span className="text-[8px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-medium uppercase border border-[#F59E0B]/30">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => (section.comingSoon || section.greyedOut) ? null : onNavigate(section.id)}
          onMouseEnter={() => prefetchModule(section.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${section.comingSoon || section.greyedOut
            ? 'text-gray-500 opacity-50 cursor-not-allowed border border-dashed border-white/5'
            : (currentPage === section.id
              ? 'bg-white/5 text-[#0D9488] border-l-4 border-[#0D9488]'
              : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent')
            }`}
          disabled={section.comingSoon || section.greyedOut}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="min-w-[20px] flex justify-center">
              <section.icon size={18} />
            </div>
            {sidebarOpen && <span className="text-sm font-medium">{section.label}</span>}
          </div>
          {sidebarOpen && section.comingSoon && (
            <span className="text-[8px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-medium uppercase border border-[#F59E0B]/30">
              Soon
            </span>
          )}
        </button>
      )}
    </div>
  );
});

NavSection.displayName = 'NavSection';
Sidebar.displayName = 'Sidebar';

export default Sidebar;
