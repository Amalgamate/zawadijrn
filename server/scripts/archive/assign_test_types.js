const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTestTypes() {
  try {
    console.log('🚀 Starting testType assignment...\n');

    // Get all tests without testType, grouped by (grade, learningArea, term, academicYear)
    const testsWithoutType = await prisma.summativeTest.findMany({
      where: { testType: null },
      select: {
        id: true,
        title: true,
        grade: true,
        learningArea: true,
        term: true,
        academicYear: true,
        testDate: true
      },
      orderBy: [
        { grade: 'asc' },
        { learningArea: 'asc' },
        { term: 'asc' },
        { academicYear: 'asc' },
        { testDate: 'asc' }
      ]
    });

    if (testsWithoutType.length === 0) {
      console.log('✅ All tests already have testTypes assigned!');
      return;
    }

    console.log(`📊 Found ${testsWithoutType.length} tests without testType\n`);

    // Group tests by (grade, learningArea, term, academicYear)
    const groups = {};
    testsWithoutType.forEach(test => {
      const key = `${test.grade}|${test.learningArea}|${test.term}|${test.academicYear}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(test);
    });

    console.log(`📋 Grouped into ${Object.keys(groups).length} groups\n`);

    const testTypes = ['OPENER', 'MID_TERM', 'END_TERM'];
    let totalUpdated = 0;
    let errors = 0;

    // Process each group
    for (const [key, tests] of Object.entries(groups)) {
      const [grade, learningArea, term, academicYear] = key.split('|');
      
      console.log(`\n📌 Group: ${grade} > ${learningArea} > ${term} > ${academicYear}`);
      console.log(`   Tests in group: ${tests.length}`);

      // Distribute testTypes round-robin
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const testType = testTypes[i % testTypes.length];
        
        try {
          await prisma.summativeTest.update({
            where: { id: test.id },
            data: { testType }
          });
          console.log(`   ✅ ${test.title}: assigned ${testType}`);
          totalUpdated++;
        } catch (err) {
          console.log(`   ❌ ${test.title}: ERROR - ${err.message}`);
          errors++;
        }
      }
    }

    console.log(`\n\n🎉 Assignment complete!`);
    console.log(`   ✅ Successfully updated: ${totalUpdated}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Verify the update
    const stats = await prisma.summativeTest.groupBy({
      by: ['testType'],
      _count: true,
      where: { archived: false }
    });

    console.log(`\n📊 Final testType distribution:`);
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Fatal Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTestTypes();
