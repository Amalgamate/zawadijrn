const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== DATABASE DIAGNOSTIC ===\n');
    
    // Try the dashboard query that was failing
    console.log('Testing findMany on summativeTest...');
    const tests = await prisma.summativeTest.findMany({
      where: { archived: false },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    console.log('SUCCESS: Found', tests.length, 'tests');
    if (tests.length > 0) {
      console.log('Sample test:', tests[0]);
    }
    console.log();
    
    // Try filtering by testType
    console.log('Testing filter by testType...');
    const byType = await prisma.summativeTest.findMany({
      where: { 
        testType: 'OPENER',
        archived: false 
      },
      take: 1
    });
    console.log('SUCCESS: Found', byType.length, 'tests with type OPENER');
    console.log();
    
    // Test level_id lookup
    console.log('Testing summativeResult with level_id...');
    const results = await prisma.summativeResult.findMany({
      where: { archived: false },
      include: { level: true },
      take: 1
    });
    console.log('SUCCESS: Found', results.length, 'results');
    if (results.length > 0) {
      console.log('Sample result:', results[0]);
    }
    
  } catch (e) {
    console.error('ERROR:', e.message);
    if (e.code) console.error('Code:', e.code);
    if (e.meta) console.error('Meta:', e.meta);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
