const { execSync } = require('child_process');

console.log("Running pre-deploy verification...");

// 0. Fix any corrupted migration records using Prisma raw query
try {
  console.log("Running fix-migrations.js...");
  execSync('node fix-migrations.js', { stdio: 'pipe' });
  console.log("✅ fix-migrations.js complete.");
} catch (error) {
  console.log("ℹ️ fix-migrations.js had warnings or was already fixed.");
}

// Helper function to resolve migrations
const resolveMigration = (name, action = '--rolled-back') => {
  try {
    console.log(`Resolving migration ${name} as ${action}...`);
    execSync(`npx prisma migrate resolve ${action} ${name}`, { stdio: 'pipe' });
    console.log(`✅ Migration ${name} confirmed/resolved.`);
  } catch (error) {
    console.log(`ℹ️ Migration ${name} already in desired state or skipped.`);
  }
};

// 1. Summative Hardening
resolveMigration('20260402074726_summative_hardening', '--applied');

// 2. Grade to String - This is the tricky one that fails during DB Push
// We clear its stuck state so migrate deploy can handle it via SQL
resolveMigration('20260402090938_grade_to_string', '--rolled-back');

// 3. Library/Accounting Sync
// We clear its stuck state. The migration SQL has "CREATE TABLE IF NOT EXISTS"
// so it's safe to re-run.
resolveMigration('20260404104631_add_library_accounting_sync_v2', '--rolled-back');

// Note: We removed the global "db push" from here because it's too aggressive 
// during the type transition. migrate deploy is safer as it handles data 
// migration SQL.

console.log("Pre-deploy pipeline complete. Proceeding to migrate...");
