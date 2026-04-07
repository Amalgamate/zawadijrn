/**
 * secondaryNav.js
 * Navigation structure for Secondary Schools (8-4-4 / KCSE curriculum)
 */

import {
  Home, Mail, Calendar, Users, GraduationCap, UserCheck,
  TrendingUp, Settings, BookOpen, Users2, Truck, Fingerprint,
  CreditCard, PieChart, Package, HelpCircle, Receipt, FileText,
  ClipboardList, BarChart3, Award, BookMarked, PlayCircle
} from 'lucide-react';

export const secondaryNavSections = [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: Home,
    items: [],
    permission: null,
  },
  {
    id: 'communications',
    label: 'Inbox',
    icon: Mail,
    permission: null,
    items: [
      { id: 'comm-notices',  label: 'Notices & Announcements', path: 'comm-notices',  permission: null },
      { id: 'comm-messages', label: 'Messages',                path: 'comm-messages', permission: 'VIEW_INBOX' },
      { id: 'comm-history',  label: 'Message History',         path: 'comm-history',  permission: null },
    ],
  },

  // ── School ────────────────────────────────────────────────────────────────
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    permission: null,
    items: [
      { id: 'students-list',       label: 'Students List',   path: 'learners-list',       permission: 'VIEW_ALL_LEARNERS' },
      { id: 'students-admissions', label: 'Admissions',      path: 'learners-admissions', permission: 'CREATE_LEARNER'    },
      { id: 'students-id-print',   label: 'ID Card Printing',path: 'learners-id-print',   permission: 'VIEW_ALL_LEARNERS', icon: CreditCard },
    ],
  },
  {
    id: 'teachers',
    label: 'Teachers',
    icon: GraduationCap,
    permission: 'MANAGE_TEACHERS',
    items: [
      { id: 'teachers-list', label: 'Teachers List', path: 'teachers-list', permission: 'MANAGE_TEACHERS' },
    ],
  },
  {
    id: 'parents',
    label: 'Parents',
    icon: UserCheck,
    permission: 'VIEW_ALL_USERS',
    items: [
      { id: 'parents-list', label: 'Parents List', path: 'parents-list', permission: 'VIEW_ALL_USERS' },
    ],
  },

  // ── Academics ─────────────────────────────────────────────────────────────
  {
    id: 'secondary-academics',
    label: 'Academics',
    icon: BookMarked,
    permission: null,
    items: [
      { id: 'sec-subjects',    label: 'Subject Management', path: 'sec-subjects',    permission: 'ACADEMIC_SETTINGS' },
      { id: 'sec-form-groups', label: 'Form Groups',        path: 'sec-form-groups', permission: 'MANAGE_FACILITIES' },
      { id: 'sec-timetable',   label: 'Timetable',          path: 'planner-timetable', permission: 'ACCESS_TIMETABLE' },
      { id: 'sec-schemes',     label: 'Schemes of Work',    path: 'planner-schemes', permission: null, icon: ClipboardList },
    ],
  },

  // ── Assessment ────────────────────────────────────────────────────────────
  {
    id: 'secondary-assessment',
    label: 'Assessment',
    icon: TrendingUp,
    permission: 'ACCESS_ASSESSMENT_MODULE',
    items: [
      { id: 'sec-mark-entry',  label: 'Mark Entry',     path: 'sec-mark-entry',  permission: 'ACCESS_ASSESSMENT_MODULE' },
      { id: 'sec-cats',        label: 'CATs',           path: 'sec-cats',        permission: 'ACCESS_ASSESSMENT_MODULE' },
      { id: 'sec-mid-term',    label: 'Mid-term Exams', path: 'sec-mid-term',    permission: 'ACCESS_ASSESSMENT_MODULE' },
      { id: 'sec-end-term',    label: 'End-term Exams', path: 'sec-end-term',    permission: 'ACCESS_ASSESSMENT_MODULE' },
      { id: 'sec-kcse-mock',   label: 'KCSE Mock',      path: 'sec-kcse-mock',   permission: 'ACCESS_ASSESSMENT_MODULE' },
    ],
  },

  // ── Results ───────────────────────────────────────────────────────────────
  {
    id: 'secondary-results',
    label: 'Results & Reports',
    icon: BarChart3,
    permission: 'VIEW_ALL_REPORTS',
    items: [
      { id: 'sec-mean-grades',      label: 'Mean Grades',       path: 'sec-mean-grades',      permission: 'VIEW_ALL_REPORTS' },
      { id: 'sec-rankings',         label: 'Class Rankings',    path: 'sec-rankings',          permission: 'VIEW_ALL_REPORTS' },
      { id: 'sec-subject-analysis', label: 'Subject Analysis',  path: 'sec-subject-analysis', permission: 'VIEW_ALL_REPORTS' },
      { id: 'sec-report-cards',     label: 'Report Cards',      path: 'sec-report-cards',     permission: 'DOWNLOAD_REPORTS' },
      { id: 'sec-kcse-prediction',  label: 'KCSE Prediction',   path: 'sec-kcse-prediction',  permission: 'VIEW_ALL_REPORTS' },
    ],
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  {
    id: 'attendance',
    label: 'Attendance',
    icon: ClipboardList,
    permission: null,
    items: [
      { id: 'attendance-daily',   label: 'Daily Attendance',   path: 'attendance-daily',   permission: 'MARK_ATTENDANCE' },
      { id: 'attendance-reports', label: 'Attendance Reports', path: 'attendance-reports', permission: 'GENERATE_ATTENDANCE_REPORTS' },
    ],
  },

  // ── LMS ───────────────────────────────────────────────────────────────────
  {
    id: 'lms',
    label: 'Learning Management',
    icon: PlayCircle,
    permission: 'ACCESS_LMS',
    items: [
      { id: 'lms-courses',     label: 'Courses',           path: 'lms-courses',     permission: 'ACCESS_LMS' },
      { id: 'lms-content',     label: 'Content Library',   path: 'lms-content',     permission: 'ACCESS_LMS' },
      { id: 'lms-enrollments', label: 'Enrollments',       path: 'lms-enrollments', permission: 'ACCESS_LMS' },
      { id: 'lms-progress',    label: 'Progress Tracking', path: 'lms-progress',    permission: 'ACCESS_LMS' },
    ],
  },

  // ── Back Office ───────────────────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance',
    icon: CreditCard,
    permission: 'FEE_MANAGEMENT',
    items: [
      { id: 'fees-structure',  label: 'Fee Structure',      path: 'fees-structure',  permission: 'FEE_MANAGEMENT' },
      { id: 'fees-collection', label: 'Fee Collection',     path: 'fees-collection', permission: 'FEE_MANAGEMENT' },
      { id: 'fees-reports',    label: 'Fee Reports',        path: 'fees-reports',    permission: 'FEE_MANAGEMENT' },
      { id: 'fees-statements', label: 'Student Statements', path: 'fees-statements', permission: 'FEE_MANAGEMENT' },
    ],
  },
  {
    id: 'hr',
    label: 'HR',
    icon: Users2,
    permission: 'HR_MANAGEMENT',
    items: [
      { id: 'hr-portal',         label: 'HR Dashboard',       path: 'hr-portal',         permission: 'HR_MANAGEMENT' },
      { id: 'hr-staff-profiles', label: 'Staff Directory',    path: 'hr-staff-profiles', permission: 'HR_MANAGEMENT' },
      { id: 'hr-payroll',        label: 'Payroll Processing', path: 'hr-payroll',         permission: 'HR_MANAGEMENT' },
      { id: 'hr-leave',          label: 'Leave Management',   path: 'hr-leave',           permission: 'HR_MANAGEMENT' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport & Hostel',
    icon: Truck,
    permission: 'TRANSPORT_MANAGEMENT',
    items: [
      { id: 'transport-routes',  label: 'Bus Routes',         path: 'transport-routes',   permission: 'TRANSPORT_MANAGEMENT' },
      { id: 'hostel-allocation', label: 'Hostel Allocation',  path: 'hostel-allocation',  permission: 'TRANSPORT_MANAGEMENT' },
      { id: 'hostel-fees',       label: 'Transport Fees',     path: 'hostel-fees',        permission: 'TRANSPORT_MANAGEMENT' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    permission: 'SCHOOL_SETTINGS',
    items: [
      { id: 'inventory-items',       label: 'Items',           path: 'inventory-items',       permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-stores',      label: 'Stores',          path: 'inventory-stores',      permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-movements',   label: 'Stock Movements', path: 'inventory-movements',   permission: 'SCHOOL_SETTINGS' },
      { id: 'inventory-assets',      label: 'Asset Register',  path: 'inventory-assets',      permission: 'SCHOOL_SETTINGS' },
    ],
  },
  {
    id: 'biometric',
    label: 'Biometric Attendance',
    icon: Fingerprint,
    permission: 'BIOMETRIC_ATTENDANCE',
    items: [
      { id: 'biometric-dashboard',  label: 'Biometric Authority',    path: 'biometric-dashboard', permission: 'BIOMETRIC_ATTENDANCE' },
      { id: 'biometric-enrollment', label: 'Fingerprint Enrollment', path: 'biometric-dashboard?tab=enrollment', permission: 'ENROLL_FINGERPRINTS' },
    ],
  },
  {
    id: 'docs-center',
    label: 'Document Center',
    icon: FileText,
    permission: null,
    items: [],
  },

  // ── System ────────────────────────────────────────────────────────────────
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    permission: 'SCHOOL_SETTINGS',
    items: [
      { id: 'settings-school',        label: 'School Settings',        path: 'settings-school',        permission: 'SCHOOL_SETTINGS'   },
      { id: 'settings-academic',      label: 'Academic Settings',      path: 'settings-academic',      permission: 'ACADEMIC_SETTINGS' },
      { id: 'settings-communication', label: 'Communication Settings', path: 'settings-communication', permission: 'SCHOOL_SETTINGS'   },
      { id: 'settings-users',         label: 'User Management',        path: 'settings-users',         permission: 'EDIT_USER'         },
      { id: 'settings-branding',      label: 'Branding',               path: 'settings-branding',      permission: 'BRANDING_SETTINGS' },
    ],
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    permission: null,
    items: [],
  },
];

// ── Secondary-specific category groupings ─────────────────────────────────────
export const SECONDARY_SCHOOL_SECTIONS   = ['students', 'teachers', 'parents', 'secondary-academics', 'secondary-assessment', 'attendance'];
export const SECONDARY_RESULTS_SECTIONS  = ['secondary-results', 'lms'];
export const SECONDARY_BACKOFFICE_SECTIONS = ['finance', 'hr', 'transport', 'inventory', 'biometric'];
export const SECONDARY_SYSTEM_SECTIONS   = ['settings', 'help'];
