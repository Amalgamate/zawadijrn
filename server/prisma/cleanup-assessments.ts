import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Starting cleanup...\n');

    // Get school ID
    const school = await prisma.school.findFirst({
      where: { name: 'ZAWADI JUNIOR ACADEMY' }
    });

    if (!school) {
      console.error('❌ School not found');
      return;
    }

    console.log(`🏫 School: ${school.name}\n`);
    console.log('Deleting in order (respecting foreign keys)...\n');

    // 1. Delete Summative Result History (depends on Summative Results)
    const resultHistoryDeleted = await prisma.summativeResultHistory.deleteMany({
      where: {
        result: {
          schoolId: school.id
        }
      }
    });
    console.log(`✅ Summative Result History: ${resultHistoryDeleted.count} deleted`);

    // 2. Delete Summative Results (depends on Tests)
    const resultsDeleted = await prisma.summativeResult.deleteMany({
      where: { schoolId: school.id }
    });
    console.log(`✅ Summative Results (Scores): ${resultsDeleted.count} deleted`);

    // 3. Delete Summative Tests (depends on Grading Systems via scaleId)
    const testsDeleted = await prisma.summativeTest.deleteMany({
      where: { schoolId: school.id }
    });
    console.log(`✅ Summative Tests: ${testsDeleted.count} deleted`);

    // 4. Delete Grading Ranges (depends on Grading Systems)
    const rangesDeleted = await prisma.gradingRange.deleteMany({
      where: {
        system: {
          schoolId: school.id
        }
      }
    });
    console.log(`✅ Grading Ranges: ${rangesDeleted.count} deleted`);

    // 5. Delete Grading Systems (Scales)
    const scalesDeleted = await prisma.gradingSystem.deleteMany({
      where: { schoolId: school.id }
    });
    console.log(`✅ Grading Systems (Scales): ${scalesDeleted.count} deleted`);

    // 6. Delete Formative Assessments
    const formativeDeleted = await prisma.formativeAssessment.deleteMany({
      where: { schoolId: school.id }
    });
    console.log(`✅ Formative Assessments: ${formativeDeleted.count} deleted`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Total Records Deleted:`);
    console.log(`   - Summative Result History: ${resultHistoryDeleted.count}`);
    console.log(`   - Summative Results (Scores): ${resultsDeleted.count}`);
    console.log(`   - Summative Tests: ${testsDeleted.count}`);
    console.log(`   - Grading Ranges: ${rangesDeleted.count}`);
    console.log(`   - Grading Systems (Scales): ${scalesDeleted.count}`);
    console.log(`   - Formative Assessments: ${formativeDeleted.count}`);
    console.log('='.repeat(60));
    console.log('\n✨ Clean slate ready for testing!\n');

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
