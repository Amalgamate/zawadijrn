const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDistribution() {
  try {
    console.log('📊 Test distribution by (grade, learningArea, term, academicYear):\n');

    // Get all tests and group them
    const tests = await prisma.summativeTest.findMany({
      where: { archived: false },
      select: {
        id: true,
        grade: true,
        learningArea: true,
        term: true,
        academicYear: true,
        title: true,
        testType: true
      }
    });

    // Group by (grade, learningArea, term, academicYear)
    const groups = {};
    tests.forEach(test => {
      const key = `${test.grade}|${test.learningArea}|${test.term}|${test.academicYear}`;
      if (!groups[key]) {
        groups[key] = {
          grade: test.grade,
          learningArea: test.learningArea,
          term: test.term,
          academicYear: test.academicYear,
          tests: []
        };
      }
      groups[key].tests.push({
        title: test.title,
        testType: test.testType || 'NULL'
      });
    });

    // Show distribution
    const distributions = {};
    for (const [key, group] of Object.entries(groups)) {
      const count = group.tests.length;
      if (!distributions[count]) {
        distributions[count] = [];
      }
      distributions[count].push({
        key,
        group,
        count
      });
    }

    // Print summary
    console.log('Distribution (# of tests per unique grade/subject/term/year):');
    for (const count of Object.keys(distributions).sort((a, b) => b - a)) {
      console.log(`  ${count} tests: ${distributions[count].length} groups`);
    }

    // Show examples of groups with 4+ tests
    console.log('\n❌ Problem Groups (4+ tests per unique combo):');
    for (const count of Object.keys(distributions).filter(c => parseInt(c) >= 4).sort((a, b) => b - a)) {
      console.log(`\n${count} tests per group - Example(s):`);
      distributions[count].slice(0, 2).forEach(item => {
        console.log(`  ${item.group.learningArea} (Grade ${item.group.grade}, ${item.group.term}):`);
        item.group.tests.forEach(t => {
          console.log(`    - ${t.title} [${t.testType}]`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDistribution();
