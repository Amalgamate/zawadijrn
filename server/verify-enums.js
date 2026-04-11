const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECKING DATABASE ENUMS ===\n');
    
    // Get all enum types - corrected query
    const enums = await prisma.$queryRaw`
      SELECT 
        t.typname,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typcategory = 'E'
      GROUP BY t.typname
      ORDER BY t.typname;
    `;
    
    console.log('ENUM TYPES IN DATABASE:');
    console.log('========================\n');
    if (enums.length === 0) {
      console.log('No enums found!');
    } else {
      enums.forEach((e) => {
        console.log(`${e.typname}:`);
        e.values.forEach(v => console.log(`  • ${v}`));
        console.log();
      });
    }
    
    // Check testType column type
    console.log('\nCHECKING SUMMATIVE_TESTS.TESTTYPE COLUMN:');
    console.log('==========================================\n');
    
    const colInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'summative_tests'
        AND column_name = 'testType';
    `;
    
    if (colInfo.length > 0) {
      console.log(JSON.stringify(colInfo[0], null, 2));
    } else {
      console.log('testType column not found!');
    }
    
    // Get all columns in summative_tests to see what we have
    console.log('\n\nALL SUMMATIVE_TESTS COLUMNS:');
    console.log('=============================\n');
    
    const allCols = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'summative_tests'
      ORDER BY ordinal_position;
    `;
    
    allCols.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} (udt: ${col.udt_name})`);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
