const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTestTypesSmarter() {
  try {
    console.log('🔄 Assigning testTypes intelligently...\n');

    // Get all tests without a testType, grouped by (grade, learningArea, term, academicYear)
    const testsWithoutType = await prisma.summativeTest.findMany({
      where: { testType: null },
      select: { 
        id: true, 
        grade: true,
        learningArea: true,
        term: true, 
        academicYear: true,
        title: true 
      },
      orderBy: [
        { grade: 'asc' },
        { learningArea: 'asc' },
        { term: 'asc' },
        { academicYear: 'asc' }
      ]
    });

    console.log(`Found ${testsWithoutType.length} tests without testType\n`);
    
    // Group tests by (grade, learningArea, term, academicYear)
    const groupMap = {};
    testsWithoutType.forEach(test => {
      const key = `${test.grade}|${test.learningArea}|${test.term}|${test.academicYear}`;
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(test);
    });

    // For each group, distribute among OPENER, MID_TERM, END_TERM
    const updateResults = { opener: 0, midTerm: 0, endTerm: 0 };
    let errorCount = 0;

    for (const [key, tests] of Object.entries(groupMap)) {
      const testTypes = ['OPENER', 'MID_TERM', 'END_TERM'];
      
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        // Cycle through testTypes (1st → OPENER, 2nd → MID_TERM, 3rd → END_TERM, 4th → OPENER again, etc.)
        const assignedType = testTypes[i % testTypes.length];
        
        try {
          await prisma.summativeTest.update({
            where: { id: test.id },
            data: { testType: assignedType }
          });
          
          if (assignedType === 'OPENER') updateResults.opener++;
          else if (assignedType === 'MID_TERM') updateResults.midTerm++;
          else if (assignedType === 'END_TERM') updateResults.endTerm++;
          
          console.log(`✅ "${test.title}" → ${assignedType}`);
        } catch (e) {
          console.log(`❌ Failed to update "${test.title}": ${e.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`  OPENER: ${updateResults.opener}`);
    console.log(`  MID_TERM: ${updateResults.midTerm}`);
    console.log(`  END_TERM: ${updateResults.endTerm}`);
    console.log(`  Errors: ${errorCount}`);

    // Verify
    console.log('\n✨ Verification - TestTypes now in system:');
    const testTypesAfter = await prisma.summativeTest.groupBy({
      by: ['testType'],
      where: { archived: false },
      _count: true
    });
    console.log(JSON.stringify(testTypesAfter, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignTestTypesSmarter();
