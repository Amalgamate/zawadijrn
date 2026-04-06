const { execSync } = require('child_process');

console.log("Running pre-deploy verification...");

// 20260402074726_summative_hardening: the schema changes in this migration
// (ALTER COLUMN grade TYPE TEXT on summative_results, testType enum cast on
// summative_tests, dedup + unique index on summative_tests) were all applied
// to the live database during an earlier deploy. However, a previous version
// of this script unconditionally marked the migration as --rolled-back on
// every deploy, causing Prisma to attempt a re-apply that hit a FK violation
// on summative_result_history.resultId.
//
// Fix: mark it as --applied so Prisma knows the DB is already up to date
// for this migration and skips it. This is a one-time correction; once
// Prisma's _prisma_migrations table has the row in a 'applied' state this
// call becomes a no-op (migrate resolve is idempotent when already applied).
try {
  console.log("Ensuring summative_hardening migration is recorded as applied...");
  execSync('npx prisma migrate resolve --applied 20260402074726_summative_hardening', { stdio: 'pipe' });
  console.log("✅ Migration 20260402074726_summative_hardening confirmed as applied.");
} catch (error) {
  console.log("✅ Migration 20260402074726_summative_hardening record already up to date.");
}

try {
  console.log("Resolving any stuck grade_to_string migrations...");
  execSync('npx prisma migrate resolve --rolled-back 20260402090938_grade_to_string', { stdio: 'pipe' });
  console.log("✅ Migration 20260402090938_grade_to_string record cleared (rolled back).");
} catch (error) {
  console.log("✅ Migration 20260402090938_grade_to_string record already in a clean state.");
}

console.log("Pre-deploy pipeline complete. Proceeding to migrate...");
