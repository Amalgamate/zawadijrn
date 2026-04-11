const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===\n');
    
    // Check summative_tests columns
    const sumTests = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'summative_tests'
      ORDER BY column_name;
    `;
    console.log('summative_tests columns:');
    console.log(sumTests);
    console.log();
    
    // Check summative_results columns
    const sumResults = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'summative_results'
      ORDER BY column_name;
    `;
    console.log('summative_results columns:');
    console.log(sumResults);
    console.log();
    
    // Check events columns
    const events = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      ORDER BY column_name;
    `;
    console.log('events columns:');
    console.log(events);
    console.log();
    
    // Check grading_ranges columns
    const gradingRanges = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'grading_ranges'
      ORDER BY column_name;
    `;
    console.log('grading_ranges columns:');
    console.log(gradingRanges);
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
