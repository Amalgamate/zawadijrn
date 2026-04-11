#!/usr/bin/env node
/**
 * Force reset migration status for missing columns migration
 * This clears the migration record from _prisma_migrations so it can be re-applied
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetMigrationStatus() {
  try {
    console.log("🔄 Checking migration status in _prisma_migrations...");
    
    // Check if our migration is marked as applied
    const migration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name LIKE '%add_missing_columns%'
    `;
    
    if (migration.length > 0) {
      console.log(`Found migration record: ${migration[0].migration_name}`);
      
      // Delete the record so it can be re-applied
      const deleted = await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations" 
        WHERE migration_name LIKE '%add_missing_columns%'
      `;
      
      console.log(`✅ Cleared migration record, will be re-applied on next deploy`);
    } else {
      console.log(`ℹ️ No migration record found for add_missing_columns (will be applied fresh)`);
    }
    
    return true;
  } catch (error) {
    console.log(`ℹ️ Could not check migration status (this is OK): ${error.message}`);
    // This is not fatal, it's just a helper
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

resetMigrationStatus()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
