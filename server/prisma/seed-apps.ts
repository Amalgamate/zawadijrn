/**
 * Seed script — Apps Module definitions
 * Run with: npx ts-node prisma/seed-apps.ts
 * Idempotent: safe to re-run at any time.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APP_DEFINITIONS = [
  // ── Core ────────────────────────────────────────────────────
  { slug: 'student-registry',   name: 'Student Registry',      category: 'Core',          icon: '🎓', sortOrder: 1,  dependencies: [],                                          description: 'Manage learner admissions, profiles, and enrolments.' },
  { slug: 'academic-year',      name: 'Academic Year',         category: 'Core',          icon: '📅', sortOrder: 2,  dependencies: [],                                          description: 'Configure terms, academic years, and class structures.' },

  // ── Academics ───────────────────────────────────────────────
  { slug: 'attendance',         name: 'Attendance',            category: 'Academics',     icon: '✅', sortOrder: 10, dependencies: ['student-registry'],                        description: 'Daily learner and staff attendance tracking.' },
  { slug: 'timetable',          name: 'Timetable',             category: 'Academics',     icon: '🗓️', sortOrder: 11, dependencies: ['student-registry', 'academic-year'],       description: 'Class schedules and timetable management.' },
  { slug: 'gradebook',          name: 'Gradebook',             category: 'Academics',     icon: '📊', sortOrder: 12, dependencies: ['student-registry'],                        description: 'Formative and summative assessments, CBC grading.' },
  { slug: 'exams',              name: 'Exams',                 category: 'Academics',     icon: '📝', sortOrder: 13, dependencies: ['timetable', 'gradebook'],                  description: 'Exam scheduling, mark entry, and result processing.' },
  { slug: 'curriculum',         name: 'Curriculum',            category: 'Academics',     icon: '📚', sortOrder: 14, dependencies: ['student-registry'],                        description: 'Learning areas, schemes of work, and subject assignments.' },
  { slug: 'library',            name: 'Library',               category: 'Academics',     icon: '🏛️', sortOrder: 15, dependencies: [],                                          description: 'Book catalog, loans, members, and fines.' },
  { slug: 'lms',                name: 'Learning Hub (LMS)',    category: 'Academics',     icon: '💻', sortOrder: 16, dependencies: ['student-registry'],                        description: 'Online courses, content uploads, and learner progress.' },

  // ── Finance ─────────────────────────────────────────────────
  { slug: 'fee-management',     name: 'Fee Management',        category: 'Finance',       icon: '💰', sortOrder: 20, dependencies: ['student-registry'],                        description: 'Fee structures, invoicing, payments, and receipts.' },
  { slug: 'payroll',            name: 'Payroll',               category: 'Finance',       icon: '💵', sortOrder: 21, dependencies: [],                                          description: 'Staff payroll, allowances, deductions, and PAYE.' },
  { slug: 'accounting',         name: 'Accounting',            category: 'Finance',       icon: '🧾', sortOrder: 22, dependencies: [],                                          description: 'Chart of accounts, journals, expenses, and bank reconciliation.' },
  { slug: 'inventory',          name: 'Inventory',             category: 'Finance',       icon: '📦', sortOrder: 23, dependencies: [],                                          description: 'Stock items, movements, requisitions, and fixed assets.' },

  // ── Communication ───────────────────────────────────────────
  { slug: 'sms-notifications',  name: 'SMS & Notifications',   category: 'Communication', icon: '📱', sortOrder: 30, dependencies: [],                                          description: 'Bulk SMS, WhatsApp broadcasts, and in-app notifications.' },
  { slug: 'parent-portal',      name: 'Parent Portal',         category: 'Communication', icon: '👨‍👩‍👧', sortOrder: 31, dependencies: ['student-registry', 'sms-notifications'],   description: 'Parent access to reports, fees, and school updates.' },
  { slug: 'announcements',      name: 'Announcements',         category: 'Communication', icon: '📢', sortOrder: 32, dependencies: [],                                          description: 'School notices, events, and staff announcements.' },

  // ── HR ──────────────────────────────────────────────────────
  { slug: 'staff-hr',           name: 'Staff HR',              category: 'HR',            icon: '👥', sortOrder: 40, dependencies: [],                                          description: 'Staff profiles, leave management, and performance reviews.' },
  { slug: 'transport',          name: 'Transport',             category: 'HR',            icon: '🚌', sortOrder: 41, dependencies: ['student-registry'],                        description: 'Routes, vehicles, and learner transport assignments.' },
  { slug: 'biometric',          name: 'Biometric',             category: 'HR',            icon: '🔐', sortOrder: 42, dependencies: [],                                          description: 'Fingerprint enrollment, clock-in/out, and attendance logs.' },

  // ── Reports ─────────────────────────────────────────────────
  { slug: 'analytics',          name: 'Analytics',             category: 'Reports',       icon: '📈', sortOrder: 50, dependencies: ['student-registry'],                        description: 'School-wide dashboards and performance analytics.' },
  { slug: 'custom-reports',     name: 'Custom Reports',        category: 'Reports',       icon: '🗂️', sortOrder: 51, dependencies: ['student-registry'],                        description: 'PDF report cards, transcripts, and custom exports.' },
];

async function main() {
  console.log('🌱 Seeding Apps Module definitions...\n');

  for (const app of APP_DEFINITIONS) {
    await prisma.app.upsert({
      where: { slug: app.slug },
      update: {
        name:         app.name,
        description:  app.description,
        category:     app.category,
        icon:         app.icon,
        sortOrder:    app.sortOrder,
        dependencies: app.dependencies,
      },
      create: {
        id:           require('crypto').randomUUID(),
        slug:         app.slug,
        name:         app.name,
        description:  app.description,
        category:     app.category,
        icon:         app.icon,
        sortOrder:    app.sortOrder,
        dependencies: app.dependencies,
        isSystem:     false,
      },
    });
    console.log(`  ✓ ${app.icon}  ${app.name} (${app.category})`);
  }

  console.log(`\n✅ Seeded ${APP_DEFINITIONS.length} app definitions.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
