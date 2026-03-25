const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function applyFix() {
  try {
    console.log('Applying direct SQL fix to mark migrations as finished...');
    const result = await prisma.$executeRaw`
      UPDATE _prisma_migrations 
      SET finished_at = NOW() 
      WHERE migration_name IN ('20260304031433_init', '20260314000000_remove_multitenant') 
      AND finished_at IS NULL
    `;
    console.log(`Fix applied. Rows updated: ${result}`);
  } catch (e) {
    console.error('Error applying fix:', e);
  }
}

async function checkMigrations() {
  try {
    const migrations = await prisma.$queryRaw`SELECT migration_name, started_at, finished_at FROM _prisma_migrations WHERE finished_at IS NULL`;
    console.log('Current Failed Migrations:');
    console.log(JSON.stringify(migrations, null, 2));
    
    if (migrations.length > 0) {
      await applyFix();
      
      const updated = await prisma.$queryRaw`SELECT migration_name, started_at, finished_at FROM _prisma_migrations WHERE finished_at IS NULL`;
      console.log('Migrations Remaining After Fix:');
      console.log(JSON.stringify(updated, null, 2));
    } else {
      console.log('No failed migrations found to fix.');
    }
  } catch (e) {
    console.error('Error querying migrations:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
