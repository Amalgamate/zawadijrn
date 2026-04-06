/**
 * seed-demo-users.mjs
 * Seeds demo accounts for all three institution types.
 *
 * Run with:  node scripts/seed-demo-users.mjs
 *
 * Demo accounts created:
 *   CBC Primary:
 *     admin@cbc-demo.zawadi    / Demo@2025!
 *     teacher@cbc-demo.zawadi  / Demo@2025!
 *
 *   Secondary:
 *     admin@secondary-demo.zawadi    / Demo@2025!
 *     teacher@secondary-demo.zawadi  / Demo@2025!
 *
 *   Tertiary:
 *     admin@tertiary-demo.zawadi    / Demo@2025!
 *     lecturer@tertiary-demo.zawadi / Demo@2025!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo@2025!';

const demoUsers = [
  // ── CBC Primary ─────────────────────────────────────────────────────────
  {
    email: 'admin@cbc-demo.zawadi',
    firstName: 'CBC',
    lastName: 'Admin',
    role: 'ADMIN',
    institutionType: 'PRIMARY_CBC',
    phone: '+254700000001',
  },
  {
    email: 'teacher@cbc-demo.zawadi',
    firstName: 'CBC',
    lastName: 'Teacher',
    role: 'TEACHER',
    institutionType: 'PRIMARY_CBC',
    phone: '+254700000002',
  },
  {
    email: 'parent@cbc-demo.zawadi',
    firstName: 'CBC',
    lastName: 'Parent',
    role: 'PARENT',
    institutionType: 'PRIMARY_CBC',
    phone: '+254700000003',
  },

  // ── Secondary ────────────────────────────────────────────────────────────
  {
    email: 'admin@secondary-demo.zawadi',
    firstName: 'Secondary',
    lastName: 'Admin',
    role: 'ADMIN',
    institutionType: 'SECONDARY',
    phone: '+254700000011',
  },
  {
    email: 'teacher@secondary-demo.zawadi',
    firstName: 'Secondary',
    lastName: 'Teacher',
    role: 'TEACHER',
    institutionType: 'SECONDARY',
    phone: '+254700000012',
  },
  {
    email: 'hod@secondary-demo.zawadi',
    firstName: 'Secondary',
    lastName: 'HeadTeacher',
    role: 'HEAD_TEACHER',
    institutionType: 'SECONDARY',
    phone: '+254700000013',
  },
  {
    email: 'accountant@secondary-demo.zawadi',
    firstName: 'Secondary',
    lastName: 'Accountant',
    role: 'ACCOUNTANT',
    institutionType: 'SECONDARY',
    phone: '+254700000014',
  },

  // ── Tertiary ─────────────────────────────────────────────────────────────
  {
    email: 'admin@tertiary-demo.zawadi',
    firstName: 'Tertiary',
    lastName: 'Admin',
    role: 'ADMIN',
    institutionType: 'TERTIARY',
    phone: '+254700000021',
  },
  {
    email: 'lecturer@tertiary-demo.zawadi',
    firstName: 'Tertiary',
    lastName: 'Lecturer',
    role: 'TEACHER',
    institutionType: 'TERTIARY',
    phone: '+254700000022',
  },
  {
    email: 'registrar@tertiary-demo.zawadi',
    firstName: 'Tertiary',
    lastName: 'Registrar',
    role: 'HEAD_TEACHER',
    institutionType: 'TERTIARY',
    phone: '+254700000023',
  },
  {
    email: 'finance@tertiary-demo.zawadi',
    firstName: 'Tertiary',
    lastName: 'Finance',
    role: 'ACCOUNTANT',
    institutionType: 'TERTIARY',
    phone: '+254700000024',
  },
];

async function main() {
  console.log('🌱 Seeding demo users...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 11);

  let created = 0;
  let skipped = 0;

  for (const userData of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });

    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${userData.email}`);
      skipped++;
      continue;
    }

    await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    console.log(`  ✅ Created [${userData.institutionType}] ${userData.role}: ${userData.email}`);
    created++;
  }

  console.log(`\n✅ Done. Created: ${created}, Skipped: ${skipped}`);
  console.log(`\n🔑 Password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log('\nDemo login accounts:');
  console.log('  CBC Primary    → admin@cbc-demo.zawadi');
  console.log('  Secondary      → admin@secondary-demo.zawadi');
  console.log('  Tertiary       → admin@tertiary-demo.zawadi');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
