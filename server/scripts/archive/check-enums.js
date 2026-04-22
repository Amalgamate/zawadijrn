const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECKING ENUM TYPES ===\n');
    
    // Check all enums
    const enums = await prisma.$queryRaw`
      SELECT typname, enum_range(NULL::typname) as values
      FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname;
    `;
    console.log('All enum types:');
    console.log(enums);
    console.log();
    
    // Check SummativeTestType values specifically
    const testTypeValues = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'SummativeTestType'
      ORDER BY enumsortorder;
    `;
    console.log('SummativeTestType enum values:');
    console.log(testTypeValues);
    console.log();
    
    // Check a few test records to see how testType is stored
    const tests = await prisma.$queryRaw`
      SELECT id, title, testType FROM summative_tests LIMIT 5;
    `;
    console.log('Sample summative_tests records:');
    console.log(tests);
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Full error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
