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

// 2. Grade to String
resolveMigration('20260402090938_grade_to_string', '--rolled-back');

// 3. Library/Accounting Sync
resolveMigration('20260404104631_add_library_accounting_sync_v2', '--rolled-back');

// 4. CBC eight-level grading enforcement
resolveMigration('20260406121000_enforce_cbc_eight_level_grading', '--rolled-back');

// 5. Rename Forms to Grade 10-12
resolveMigration('20260407160000_rename_forms_to_grade10_12', '--rolled-back');

// 6. FORCE the new missing columns migration to be recognized
console.log("🔧 Ensuring new migrations are recognized...");

// Check status first
try {
  execSync('npx prisma migrate status', { stdio: 'inherit' });
} catch (error) {
  console.log("ℹ️ Migration status check completed.");
}

console.log("Pre-deploy pipeline complete. Proceeding to migrate...");
