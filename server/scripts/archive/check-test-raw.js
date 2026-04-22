const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECKING SUMMATIVE_TESTS DATA ===\n');
    
    // Direct SQL query
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "testType" IS NOT NULL THEN 1 END) as with_type,
        COUNT(CASE WHEN "testType" IS NULL THEN 1 END) as without_type
      FROM "summative_tests"
      LIMIT 1;
    `;
    
    console.log(JSON.stringify(result[0], null, 2));
    
    // Get samples
    const samples = await prisma.$queryRaw`
      SELECT id, title, "testType", term, grade
      FROM "summative_tests"
      LIMIT 5;
    `;
    
    console.log('\nSample Tests:');
    samples.forEach((s, i) => {
      console.log(`${i+1}. ${s.title} - testType: ${s.testType || 'NULL'}`);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
