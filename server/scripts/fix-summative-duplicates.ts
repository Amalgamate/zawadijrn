/**
 * fix-summative-duplicates.ts
 * 
 * One-time production fix script.
 * 
 * The migration `20260402074726_summative_hardening` failed in production
 * because it tried to add a UNIQUE constraint on summative_tests
 * (grade, learningArea, term, academicYear, testType) but duplicate rows
 * already existed in the database.
 * 
 * This script:
 *   1. Finds all duplicate summative_tests rows
 *   2. Keeps the LATEST (highest id) row in each duplicate group
 *   3. Deletes the older duplicates
 *   4. Prints a summary of what was removed
 * 
 * After running this script, execute:
 *   npx prisma migrate resolve --applied 20260402074726_summative_hardening
 *   npx prisma migrate deploy
 * 
 * Usage:
 *   npx ts-node scripts/fix-summative-duplicates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  console.log('🔍 Scanning for duplicate summative_tests rows...\n');

  // Find all duplicate groups
  const duplicates = await prisma.$queryRaw<
    Array<{
      grade: string;
      learningArea: string;
      term: string;
      academicYear: number;
      testType: string;
      count: bigint;
      ids: string;
    }>
  >`
    SELECT
      grade,
      "learningArea",
      term,
      "academicYear",
      "testType",
      COUNT(*) AS count,
      STRING_AGG(id::text, ',' ORDER BY id DESC) AS ids
    FROM summative_tests
    GROUP BY grade, "learningArea", term, "academicYear", "testType"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found. Database is already clean.');
    console.log('\nYou can now run:');
    console.log('  npx prisma migrate resolve --applied 20260402074726_summative_hardening');
    console.log('  npx prisma migrate deploy');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate group(s):\n`);

  let totalDeleted = 0;

  for (const dup of duplicates) {
    const idList = dup.ids.split(',').map((id: string) => id.trim());
    const keepId = idList[0]; // First = highest id = newest
    const deleteIds = idList.slice(1);

    console.log(`  Grade: ${dup.grade} | Subject: ${dup.learningArea} | Term: ${dup.term} | Year: ${dup.academicYear} | Type: ${dup.testType}`);
    console.log(`    Count: ${dup.count} | Keeping ID: ${keepId} | Deleting: [${deleteIds.join(', ')}]`);

    const result = await prisma.$executeRaw`
      DELETE FROM summative_tests
      WHERE id = ANY(${deleteIds}::text[])
    `;

    totalDeleted += Number(result);
    console.log(`    ✓ Deleted ${result} row(s)\n`);
  }

  console.log(`\n✅ Done. Removed ${totalDeleted} duplicate row(s) across ${duplicates.length} group(s).`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Next steps to unblock the production deployment:');
  console.log('');
  console.log('  1. Mark the failed migration as resolved:');
  console.log('     npx prisma migrate resolve --applied 20260402074726_summative_hardening');
  console.log('');
  console.log('  2. Apply remaining pending migrations:');
  console.log('     npx prisma migrate deploy');
  console.log('');
  console.log('  3. Redeploy the application on Render.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
