const { execSync } = require('child_process');
require('dotenv').config({ path: '../.env' });

/**
 * This script forces a schema sync to the production database.
 * Use this only for emergency production database repair.
 */
async function syncProd() {
  console.log("🚀 Starting Emergency Production DB Sync...");
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Error: No DATABASE_URL found in your root .env file.");
    process.exit(1);
  }

  if (!dbUrl.includes('postgres')) {
    console.warn("⚠️ Warning: Your DATABASE_URL looks like a local database.");
    console.warn("Make sure you have your Production DB URL in the .env file.");
  }

  try {
    console.log("📡 Connecting to Production Database...");
    
    // Force DB push without generating client (we just want the columns in the DB)
    execSync('npx prisma db push --schema=../prisma/schema.prisma --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log("\n✅ Production Database Synced! Senior School columns added.");
    console.log("Redeploy the production stack after the schema sync completes.");
  } catch (error) {
    console.error("\n❌ Sync Failed. Check your internet and DATABASE_URL.");
    process.exit(1);
  }
}

syncProd();
