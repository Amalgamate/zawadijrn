/**
 * seed-demo-users.mjs
 * Seeds demo accounts for the current Prisma `User` model.
 *
 * Run with:  node scripts/seed-demo-users.mjs
 *
 * Demo learners from `server/scripts/create-demo-student.ts` use parent@demo.zawadi as guardian.
 * To attach an existing "Demo Learner" row:  cd server && npm run demo:link-parent
 *
 * Demo accounts created:
 *   ADMIN / TEACHER / PARENT / ACCOUNTANT roles:
 *     admin@demo.zawadi        / Demo@2025!
 *     teacher@demo.zawadi      / Demo@2025!
 *     parent@demo.zawadi       / Demo@2025!
 *     accountant@demo.zawadi   / Demo@2025!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo@2025!';

const demoUsers = [
  {
    email: 'admin@demo.zawadi',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'ADMIN',
    phone: '+254700000001',
  },
  {
    email: 'teacher@demo.zawadi',
    firstName: 'Demo',
    lastName: 'Teacher',
    role: 'TEACHER',
    phone: '+254700000002',
  },
  {
    email: 'parent@demo.zawadi',
    firstName: 'Demo',
    lastName: 'Parent',
    role: 'PARENT',
    phone: '+254700000003',
  },
  {
    email: 'accountant@demo.zawadi',
    firstName: 'Demo',
    lastName: 'Accountant',
    role: 'ACCOUNTANT',
    phone: '+254700000014',
  },
];

async function main() {
  console.log('🌱 Seeding demo users...\n');

  const bcryptCost = Number(process.env.BCRYPT_COST || 11);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, bcryptCost);

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
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    console.log(`  ✅ Created ${userData.role}: ${userData.email}`);
    created++;
  }

  console.log(`\n✅ Done. Created: ${created}, Skipped: ${skipped}`);
  console.log(`\n🔑 Password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log('\nDemo login accounts:');
  console.log('  Admin          → admin@demo.zawadi');
  console.log('  Teacher        → teacher@demo.zawadi');
  console.log('  Parent         → parent@demo.zawadi');
  console.log('  Accountant     → accountant@demo.zawadi');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
