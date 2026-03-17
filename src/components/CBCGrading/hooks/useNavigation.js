import { useMemo } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import {
    Home, Mail, Calendar, Users, GraduationCap, UserCheck,
    TrendingUp, Zap, CheckSquare, Settings, BookOpen,
    Users2, Truck, Fingerprint, CreditCard, PieChart,
    Package, Building2, HelpCircle, Receipt, FileText
} from 'lucide-react';

const focusModules = ['dashboard', 'communications', 'planner', 'learners', 'teachers', 'parents', 'assessment', 'learning-hub', 'timetable', 'attendance', 'docs-center', 'knowledge-base', 'facilities', 'settings', 'hr', 'finance', 'inventory'];

export const allNavSections = [
    {
        id: 'dashboard',
        label: 'Overview',
        icon: Home,
        items: [],
        permission: null
    },
    {
        id: 'communications',
        label: 'Inbox',
        icon: Mail,
        permission: null,
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
        label: 'Scholars',
        icon: Users,
        permission: null,
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
        permission: 'MANAGE_TEACHERS',
        items: [
            { id: 'teachers-list', label: 'Tutors List', path: 'teachers-list', permission: 'MANAGE_TEACHERS' }
        ]
    },
    {
        id: 'parents',
        label: 'Guardians',
        icon: UserCheck,
        permission: 'VIEW_ALL_USERS',
        items: [
            { id: 'parents-list', label: 'Parents List', path: 'parents-list', permission: 'VIEW_ALL_USERS' }
        ]
    },
    {
        id: 'assessment',
        label: 'Assessment',
        icon: TrendingUp,
        permission: 'ACCESS_ASSESSMENT_MODULE',
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
                id: 'group-holistic',
                label: 'CBC Holistic',
                type: 'group',
                icon: BookOpen,
                items: [
                    { id: 'assess-core-competencies', label: 'Core Competencies', path: 'assess-core-competencies', permission: 'ACCESS_ASSESSMENT_MODULE' },
                    { id: 'assess-values', label: 'National Values', path: 'assess-values', permission: 'ACCESS_ASSESSMENT_MODULE' },
                    { id: 'assess-cocurricular', label: 'Co-Curricular', path: 'assess-cocurricular', permission: 'ACCESS_ASSESSMENT_MODULE' },
                    { id: 'assess-termly-report', label: 'Termly Report', path: 'assess-termly-report', permission: 'ACCESS_ASSESSMENT_MODULE' },
                ]
            },
            {
                id: 'group-general',
                label: 'Configuration',
                type: 'group',
                icon: Settings,
                items: [
                    { id: 'assess-learning-areas', label: 'Learning Areas', path: 'assess-learning-areas', permission: 'MANAGE_LEARNING_AREAS' },
                    { id: 'assess-summative-tests', label: 'Tests', path: 'assess-summative-tests', permission: 'ACCESS_ASSESSMENT_MODULE' }
                ]
            }
        ]
    },
    {
        id: 'learning-hub',
        label: 'Resource Center',
        icon: BookOpen,
        permission: 'ACCESS_LEARNING_HUB',
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
        permission: 'ACCESS_TIMETABLE',
        items: []
    },
    {
        id: 'attendance',
        label: 'Attendance',
        icon: CheckSquare,
        permission: null,
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
        permission: 'HR_MANAGEMENT',
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
        permission: 'LIBRARY_MANAGEMENT',
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
        permission: 'TRANSPORT_MANAGEMENT',
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
        permission: 'FEE_MANAGEMENT',
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
        permission: 'BIOMETRIC_ATTENDANCE',
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
        permission: null,
        items: []
    },
    {
        id: 'facilities',
        label: 'The Campus',
        icon: Building2,
        permission: 'MANAGE_FACILITIES',
        items: [
            { id: 'facilities-classes', label: 'Classes & Streams', path: 'facilities-classes', permission: 'MANAGE_FACILITIES' }
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        permission: 'SCHOOL_SETTINGS',
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

export const useNavigation = () => {
    const { can, role } = usePermissions();

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
                return false;
            }

            // Settings is handled separately
            if (section.id === 'settings') {
                return false;
            }

            if (section.permission && !can(section.permission)) {
                return false;
            }

            if (section.items.length > 0) {
                const visibleItems = processItems(section.items);
                return visibleItems.length > 0;
            }
            return true;
        }).map(section => ({
            ...section,
            items: processItems(section.items)
        }));
    }, [can]);

    const settingsSection = useMemo(() => {
        if (role === 'TEACHER') return null;
        const section = allNavSections.find(s => s.id === 'settings');
        if (!section || !can(section.permission)) return null;

        const isItemVisible = (item) => !item.permission || can(item.permission);
        return {
            ...section,
            items: section.items.filter(isItemVisible)
        };
    }, [can, role]);

    const educationSections = useMemo(() => {
        if (role === 'TEACHER') {
            return navSections.filter(s => ['learners', 'assessment', 'planner', 'timetable', 'learning-hub', 'attendance'].includes(s.id));
        }
        if (role === 'ACCOUNTANT') {
            return navSections.filter(s =>
                !['learning-hub', 'timetable'].includes(s.id) &&
                ['learners', 'assessment', 'attendance'].includes(s.id)
            );
        }
        return navSections.filter(s =>
            ['learners', 'teachers', 'parents', 'assessment', 'learning-hub', 'timetable', 'attendance'].includes(s.id)
        );
    }, [navSections, role]);

    const sharedSections = useMemo(() => {
        if (role === 'TEACHER') return [];
        return navSections.filter(s =>
            ['docs-center', 'knowledge-base'].includes(s.id)
        );
    }, [navSections, role]);

    const schoolSections = useMemo(() => {
        if (role === 'TEACHER') return [];
        return navSections.filter(s =>
            ['hr', 'finance', 'inventory', 'library', 'transport', 'biometric'].includes(s.id)
        );
    }, [navSections, role]);

    const facilitiesSections = useMemo(() => {
        if (role === 'TEACHER') return [];
        return navSections.filter(s => s.id === 'facilities');
    }, [navSections, role]);

    const dashboardSection = navSections.find(s => s.id === 'dashboard');

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

    const helpSection = useMemo(() => {
        if (role === 'TEACHER') return null;
        return navSections.find(s => s.id === 'help');
    }, [navSections, role]);

    return {
        navSections,
        settingsSection,
        educationSections,
        sharedSections,
        schoolSections,
        facilitiesSections,
        dashboardSection,
        communicationSection,
        helpSection
    };
};
