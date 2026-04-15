const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeTestTypes() {
  try {
    console.log('🔍 Analyzing testType distribution...\n');

    // Count tests by testType
    const distribution = await prisma.summativeTest.groupBy({
      by: ['testType'],
      _count: true,
      where: { archived: false }
    });

    console.log('📊 Current testType distribution:');
    console.log(JSON.stringify(distribution, null, 2));

    // Find conflicts - combinations that already exist
    const existingCombos = await prisma.summativeTest.findMany({
      select: {
        grade: true,
        learningArea: true,
        term: true,
        academicYear: true,
        testType: true,
        _count: true
      },
      where: { archived: false, testType: { not: null } }
    });

    console.log('\n📋 Existing (grade, learningArea, term, academicYear, testType) combinations:');
    const comboMap = {};
    existingCombos.forEach(test => {
      const key = `${test.grade}|${test.learningArea}|${test.term}|${test.academicYear}|${test.testType}`;
      comboMap[key] = true;
    });
    console.log(`Total existing combinations: ${Object.keys(comboMap).length}`);

    // Check how many tests per group want to be the same testType
    const groupsWithConflicts = await prisma.$queryRaw`
      SELECT grade, "learningArea", term, "academicYear", testType, COUNT(*) as count
      FROM summative_tests
      WHERE archived = false AND "testType" IS NOT NULL
      GROUP BY grade, "learningArea", term, "academicYear", testType
      HAVING COUNT(*) > 1
    `;

    console.log('\n⚠️ Groups with multiple tests of the same testType:');
    console.log(JSON.stringify(groupsWithConflicts, null, 2));

    // Most important: what testTypes are missing data?
    const testTypeResults = await prisma.$queryRaw`
      SELECT st."testType", COUNT(sr.id) as result_count
      FROM summative_tests st
      LEFT JOIN summative_results sr ON st.id = sr."testId"
      WHERE st.archived = false AND sr."learnerId" IS NOT NULL
      GROUP BY st."testType"
    `;

    console.log('\n📈 Test results by testType:');
    console.log(JSON.stringify(testTypeResults, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTestTypes();
