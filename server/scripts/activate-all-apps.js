/**
 * activate-all-apps.js
 *
 * One-shot script: activates every App in the App table for the first school
 * found in the database. Safe to re-run — uses upsert so nothing is duplicated.
 *
 * Run from the /server directory:
 *   node scripts/activate-all-apps.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Resolve school
  const school = await prisma.school.findFirst({ select: { id: true, name: true } });
  if (!school) {
    console.error('❌  No school found in the database. Run the school provisioning step first.');
    process.exit(1);
  }
  console.log(`\n🏫  School: ${school.name} (${school.id})\n`);

  // 2. Fetch all app definitions
  const apps = await prisma.app.findMany({ orderBy: { sortOrder: 'asc' } });
  if (!apps.length) {
    console.error('❌  No apps found. Run: npm run seed:apps  first.');
    process.exit(1);
  }
  console.log(`📦  Found ${apps.length} app definitions. Activating all…\n`);

  let activated = 0;
  let alreadyOn  = 0;

  for (const app of apps) {
    const result = await prisma.schoolAppConfig.upsert({
      where: {
        schoolId_appId: { schoolId: school.id, appId: app.id },
      },
      update: {
        isActive: true,
      },
      create: {
        schoolId:  school.id,
        appId:     app.id,
        isActive:  true,
        isVisible: true,
      },
    });

    if (result.isActive) {
      console.log(`  ✅  ${app.slug.padEnd(30)} → ACTIVE`);
      activated++;
    } else {
      console.log(`  ➖  ${app.slug.padEnd(30)} → already active`);
      alreadyOn++;
    }
  }

  console.log(`\n✅  Done — ${activated} activated, ${alreadyOn} were already active.\n`);

  // 3. Verify fee-management specifically
  const feeApp = await prisma.app.findUnique({ where: { slug: 'fee-management' } });
  if (feeApp) {
    const cfg = await prisma.schoolAppConfig.findUnique({
      where: { schoolId_appId: { schoolId: school.id, appId: feeApp.id } },
    });
    console.log(`🔍  fee-management isActive = ${cfg?.isActive ?? 'NO CONFIG ROW'}`);
  }
}

main()
  .catch(err => {
    console.error('❌  Script failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
