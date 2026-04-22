/**
 * seed-apps.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent seed for the `apps` table.
 * Run with:  npx ts-node --project tsconfig.json scripts/seed-apps.ts
 *
 * Safe to re-run at any time — uses upsert so existing rows are updated
 * in place. Does NOT touch SchoolAppConfig (per-school state).
 *
 * App slugs are the stable contract between this seed and the frontend/backend.
 * Never rename a slug after schools have live configs — create a migration
 * script instead.
 */

import { AppsService } from '../src/services/apps.service';
import prisma from '../src/config/database';

// ─── App Definitions ─────────────────────────────────────────────────────────
// category must match the categories displayed in AppsPage.jsx:
//   'Core' | 'Academics' | 'Finance' | 'Communication' | 'HR' | 'Reports'

const APP_DEFINITIONS = [
  // ── Core ──────────────────────────────────────────────────────────────────
  {
    slug:         'student-registry',
    name:         'Student Registry',
    description:  'Central learner database — admissions, profiles, and enrolment records.',
    category:     'Core',
    icon:         '🎓',
    sortOrder:    1,
    dependencies: [],
    isSystem:     false,
  },
  {
    slug:         'academic-year',
    name:         'Academic Year',
    description:  'Manage academic years, terms, and key dates.',
    category:     'Core',
    icon:         '📅',
    sortOrder:    2,
    dependencies: [],
    isSystem:     false,
  },

  // ── Academics ─────────────────────────────────────────────────────────────
  {
    slug:         'timetable',
    name:         'Timetable',
    description:  'Class schedules, subject allocation, and room management.',
    category:     'Academics',
    icon:         '🗓️',
    sortOrder:    10,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'gradebook',
    name:         'Gradebook',
    description:  'Formative and summative assessment recording and reporting.',
    category:     'Academics',
    icon:         '📊',
    sortOrder:    11,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'exams',
    name:         'Exams',
    description:  'Exam scheduling, mark entry, and end-term reports.',
    category:     'Academics',
    icon:         '📝',
    sortOrder:    12,
    dependencies: ['timetable', 'gradebook'],
    isSystem:     false,
  },
  {
    slug:         'attendance',
    name:         'Attendance',
    description:  'Daily learner and staff attendance tracking.',
    category:     'Academics',
    icon:         '✅',
    sortOrder:    13,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'library',
    name:         'Library',
    description:  'Book catalog, loan tracking, and member management.',
    category:     'Academics',
    icon:         '📚',
    sortOrder:    14,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'curriculum',
    name:         'Curriculum',
    description:  'Learning areas, schemes of work, and lesson planning.',
    category:     'Academics',
    icon:         '🗂️',
    sortOrder:    15,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'lms',
    name:         'Learning Management (LMS)',
    description:  'Online courses, content library, and learner progress tracking.',
    category:     'Academics',
    icon:         '🎬',
    sortOrder:    16,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'planner',
    name:         'School Planner',
    description:  'Calender, events, and school-wide scheduling.',
    category:     'Academics',
    icon:         '🗓️',
    sortOrder:    17,
    dependencies: ['student-registry'],
    isSystem:     false,
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    slug:         'fee-management',
    name:         'Fee Management',
    description:  'Fee structures, invoicing, payments, waivers, and statements.',
    category:     'Finance',
    icon:         '💳',
    sortOrder:    20,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'payroll',
    name:         'Payroll',
    description:  'Staff salary computation, payslips, and statutory deductions.',
    category:     'Finance',
    icon:         '💰',
    sortOrder:    21,
    dependencies: [],
    isSystem:     false,
  },
  {
    slug:         'accounting',
    name:         'Accounting',
    description:  'Chart of accounts, journal entries, expenses, and reconciliation.',
    category:     'Finance',
    icon:         '📒',
    sortOrder:    22,
    dependencies: [],
    isSystem:     false,
  },

  // ── Communication ─────────────────────────────────────────────────────────
  {
    slug:         'sms-notifications',
    name:         'SMS & Notifications',
    description:  'Bulk SMS, WhatsApp broadcasts, and in-app notifications.',
    category:     'Communication',
    icon:         '💬',
    sortOrder:    30,
    dependencies: [],
    isSystem:     false,
  },
  {
    slug:         'parent-portal',
    name:         'Parent Portal',
    description:  'Parent-facing access to learner results, fees, and communications.',
    category:     'Communication',
    icon:         '👨‍👩‍👧',
    sortOrder:    31,
    dependencies: ['student-registry', 'sms-notifications'],
    isSystem:     false,
  },
  {
    slug:         'announcements',
    name:         'Announcements',
    description:  'School-wide notices and targeted announcements.',
    category:     'Communication',
    icon:         '📢',
    sortOrder:    32,
    dependencies: [],
    isSystem:     false,
  },

  // ── HR ────────────────────────────────────────────────────────────────────
  {
    slug:         'staff-hr',
    name:         'Staff HR',
    description:  'Staff profiles, leave management, performance reviews, and documents.',
    category:     'HR',
    icon:         '👥',
    sortOrder:    40,
    dependencies: [],
    isSystem:     false,
  },
  {
    slug:         'transport',
    name:         'Transport',
    description:  'Bus routes, vehicle roster, driver management, and transport fees.',
    category:     'HR',
    icon:         '🚌',
    sortOrder:    41,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'hostel',
    name:         'Hostel',
    description:  'Dormitory and room allocation for boarding students.',
    category:     'HR',
    icon:         '🏠',
    sortOrder:    42,
    dependencies: ['student-registry'],
    isSystem:     false,
  },
  {
    slug:         'inventory',
    name:         'Inventory',
    description:  'Stock management, asset register, and procurement requisitions.',
    category:     'HR',
    icon:         '📦',
    sortOrder:    43,
    dependencies: [],
    isSystem:     false,
  },
  {
    slug:         'biometric',
    name:         'Biometric Attendance',
    description:  'Fingerprint terminal integration for staff and learner clock-in.',
    category:     'HR',
    icon:         '👆',
    sortOrder:    44,
    dependencies: ['attendance'],
    isSystem:     false,
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    slug:         'analytics',
    name:         'Analytics',
    description:  'School-wide performance dashboards and trend analysis.',
    category:     'Reports',
    icon:         '📈',
    sortOrder:    50,
    dependencies: ['gradebook'],
    isSystem:     false,
  },
  {
    slug:         'custom-reports',
    name:         'Custom Reports',
    description:  'Build and export ad-hoc reports across all modules.',
    category:     'Reports',
    icon:         '🗃️',
    sortOrder:    51,
    dependencies: [],
    isSystem:     false,
  },
  {
    slug:         'document-center',
    name:         'Document Center',
    description:  'Centralized file management and storage for school documents.',
    category:     'Core',
    icon:         '📁',
    sortOrder:    3,
    dependencies: [],
    isSystem:     true,
  },
] ;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  Seeding apps table…\n');

  let created = 0;
  let updated = 0;

  for (const def of APP_DEFINITIONS) {
    // Check if it already exists so we can log created vs updated
    const existing = await (prisma as any).app.findUnique({ where: { slug: def.slug } });

    await AppsService.upsertAppDefinition(def);

    if (existing) {
      console.log(`  ↻  updated  ${def.slug}`);
      updated++;
    } else {
      console.log(`  ✚  created  ${def.slug}`);
      created++;
    }
  }

  console.log(`\n✅  Done — ${created} created, ${updated} updated (${APP_DEFINITIONS.length} total)\n`);

  // Verify
  const count = await (prisma as any).app.count();
  console.log(`   apps table now has ${count} rows.`);
}

main()
  .catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
