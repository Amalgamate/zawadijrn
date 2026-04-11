const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECKING SUMMATIVE_TESTS DATA ===\n');
    
    // Check if there are any tests with testType set
    const testsWithType = await prisma.summativeTest.count({
      where: { testType: { not: null } }
    });
    
    const testsWithoutType = await prisma.summativeTest.count({
      where: { testType: null }
    });
    
    const totalTests = await prisma.summativeTest.count();
    
    console.log(`Total Summative Tests: ${totalTests}`);
    console.log(`Tests WITH testType: ${testsWithType}`);
    console.log(`Tests WITHOUT testType (null): ${testsWithoutType}`);
    
    if (totalTests > 0) {
      console.log('\n10 Sample Tests:');
      const samples = await prisma.summativeTest.findMany({
        take: 10,
        select: { id: true, title: true, testType: true, term: true, grade: true }
      });
      
      samples.forEach((t, idx) => {
        console.log(`${idx + 1}. ${t.title.padEnd(30)} testType: ${t.testType || '<NULL>'}`);
      });
    }
    
    // Now try the problematic query without filtering by testType
    console.log('\n\nTrying WITHOUT testType filter:');
    const latestTest = await prisma.summativeTest.findFirst({
      where: { archived: false, academicYear: 2026, term: 'TERM_1' },
      orderBy: { createdAt: 'desc' },
      select: { testType: true, term: true, academicYear: true }
    });
    
    console.log('Latest Test:', JSON.stringify(latestTest, null, 2));
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Code:', e.code);
  } finally {
    await prisma.$disconnect();
  }
})();
