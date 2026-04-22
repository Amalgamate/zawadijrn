const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestTypes() {
  try {
    console.log('🔍 Checking test data for GRADE_9 TERM_1...\n');

    // Check what testTypes have data
    const testTypes = await prisma.summativeTest.groupBy({
      by: ['testType'],
      where: {
        grade: 'GRADE_9',
        term: 'TERM_1',
        archived: false
      },
      _count: true
    });

    console.log('📊 TestTypes with data in GRADE_9, TERM_1:');
    console.log(JSON.stringify(testTypes, null, 2));

    // Check all distinct testTypes in the system
    console.log('\n\n🌍 All distinct testTypes in system:');
    const allTestTypes = await prisma.summativeTest.findMany({
      select: { testType: true },
      where: { archived: false },
      distinct: ['testType']
    });
    console.log(allTestTypes.map(t => t.testType));

    // Check results per testType for GRADE_9
    console.log('\n\n📋 Results count by testType for GRADE_9, TERM_1:');
    const resultsByType = await prisma.summativeResult.groupBy({
      by: ['test'],
      where: {
        learner: { grade: 'GRADE_9' },
        test: { term: 'TERM_1', archived: false }
      },
      _count: true
    });
    
    // Get test details
    const allResults = await prisma.summativeResult.findMany({
      where: {
        learner: { grade: 'GRADE_9' },
        test: { term: 'TERM_1', archived: false }
      },
      select: {
        test: {
          select: { testType: true, title: true, learningArea: true }
        }
      },
      distinct: ['test']
    });

    const typeMap = {};
    allResults.forEach(r => {
      const type = r.test.testType || 'NULL';
      if (!typeMap[type]) typeMap[type] = 0;
      typeMap[type]++;
    });

    console.log(typeMap);

    // Check if we have any OPENER/MIDTERM/END_TERM tests at all
    console.log('\n\n🔎 Checking for specific testTypes:');
    const opener = await prisma.summativeTest.count({
      where: { testType: 'OPENER', archived: false }
    });
    const midTerm = await prisma.summativeTest.count({
      where: { testType: { in: ['MIDTERM', 'MID_TERM'] }, archived: false }
    });
    const endTerm = await prisma.summativeTest.count({
      where: { testType: { in: ['END_TERM', 'END_OF_TERM'] }, archived: false }
    });

    console.log(`OPENER tests: ${opener}`);
    console.log(`MIDTERM/MID_TERM tests: ${midTerm}`);
    console.log(`END_TERM/END_OF_TERM tests: ${endTerm}`);

    // Show sample tests
    console.log('\n\n📝 Sample tests from GRADE_9:');
    const samples = await prisma.summativeTest.findMany({
      where: { grade: 'GRADE_9', archived: false },
      select: { 
        testType: true, 
        title: true, 
        term: true,
        learningArea: true,
        academicYear: true
      },
      take: 10
    });
    console.log(JSON.stringify(samples, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestTypes();
