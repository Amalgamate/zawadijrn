const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTestTypesSmarter() {
  try {
    console.log('🔧 Smart testType assignment (aware of existing assignments)...\n');

    // For each (grade, learningArea, term, academicYear) group, 
    // assign testTypes to null tests based on how many testTypes already exist in that group
    
    // Get all groups with their testType distribution
    const allTests = await prisma.summativeTest.findMany({
      where: { archived: false },
      select: {
        id: true,
        grade: true,
        learningArea: true,
        term: true,
        academicYear: true,
        title: true,
        testType: true
      },
      orderBy: [
        { grade: 'asc' },
        { learningArea: 'asc' },
        { term: 'asc' },
        { academicYear: 'asc' }
      ]
    });

    // Group by (grade, learningArea, term, academicYear)
    const groups = {};
    allTests.forEach(test => {
      const key = `${test.grade}|${test.learningArea}|${test.term}|${test.academicYear}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(test);
    });

    const testTypes = ['OPENER', 'MID_TERM', 'END_TERM'];
    let updated = 0;
    let failed = 0;

    // For each group, assign testTypes intelligently
    for (const [key, tests] of Object.entries(groups)) {
      // Separate tests by current testType status
      const assigned = tests.filter(t => t.testType !== null);
      const unassigned = tests.filter(t => t.testType === null);

      // Figure out which testTypes are already in use in this group
      const usedTypes = new Set(assigned.map(t => t.testType));
      
      // Get available testTypes for this group
      const availableTypes = testTypes.filter(type => !usedTypes.has(type));

      // Assign available types to unassigned tests
      for (let i = 0; i < unassigned.length && availableTypes.length > 0; i++) {
        const test = unassigned[i];
        const testType = availableTypes[i];

        try {
          await prisma.summativeTest.update({
            where: { id: test.id },
            data: { testType }
          });
          updated++;
          console.log(`✅ Assigned "${test.title}" → ${testType}`);
        } catch (e) {
          failed++;
          console.log(`❌ Failed "${test.title}" → ${testType}: ${e.message.split('\n')[0]}`);
        }
      }
    }

    console.log(`\n📊 Summary: ${updated} updated, ${failed} failed\n`);

    // Final verification
    const finalStats = await prisma.summativeTest.groupBy({
      by: ['testType'],
      where: { archived: false },
      _count: true
    });

    console.log('✨ Final TestType distribution:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.testType || 'NULL'}: ${stat._count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestTypesSmarter();
