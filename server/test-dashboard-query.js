const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== TESTING DASHBOARD QUERY ===\n');
    
    // Replicate the dashboard query that was failing
    const latestTest = await prisma.summativeTest.findFirst({
      where: { archived: false, academicYear: 2026, term: 'TERM_1' },
      orderBy: { createdAt: 'desc' },
      select: { testType: true, term: true, academicYear: true }
    });
    
    console.log('latestTest query: SUCCESS');
    console.log(JSON.stringify(latestTest, null, 2));
    
    if (latestTest && latestTest.testType) {
      console.log('\n\nTesting WHERE clause with enum value...');
      const testsInSeries = await prisma.summativeTest.findMany({
        where: {
          testType: latestTest.testType,
          term: latestTest.term,
          academicYear: latestTest.academicYear,
          archived: false
        },
        select: { id: true, grade: true },
        take: 5
      });
      
      console.log(`✅ Found ${testsInSeries.length} tests in series`);
      console.log('Sample:');
      testsInSeries.forEach((t, i) => {
        console.log(`  ${i+1}. ${t.id} - grade: ${t.grade}`);
      });
    }
    
    console.log('\n✅ DASHBOARD QUERY WORKS!');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
