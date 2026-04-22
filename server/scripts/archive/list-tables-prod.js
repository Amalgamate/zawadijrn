const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== COMPARING DATABASE TABLES ===\n');
    
    // Get all tables from production database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('PRODUCTION TABLES IN DATABASE:');
    console.log('================================\n');
    tables.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.table_name}`);
    });
    console.log(`\nTotal: ${tables.length} tables\n`);
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
