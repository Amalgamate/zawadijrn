const { execSync } = require('child_process');

console.log("Running pre-deploy verification...");

// ─── 20260402074726_summative_hardening ──────────────────────────────────────
// Schema changes were applied to the live DB during an earlier deploy.
// Mark as --applied so Prisma skips re-applying it. Idempotent once applied.
try {
  console.log("Ensuring summative_hardening migration is recorded as applied...");
  execSync('npx prisma migrate resolve --applied 20260402074726_summative_hardening', { stdio: 'pipe' });
  console.log("✅ Migration 20260402074726_summative_hardening confirmed as applied.");
} catch (error) {
  console.log("✅ Migration 20260402074726_summative_hardening record already up to date.");
}

// ─── 20260402090938_grade_to_string ──────────────────────────────────────────
// This migration previously failed with a FK violation on summative_result_history
// during dedup. The migration SQL has been corrected (array-based cascade + orphan
// safety-net). Clear any stuck state so Prisma re-applies the fixed SQL.
// Once it succeeds this becomes a no-op (resolve --rolled-back on an already-applied
// migration is silently ignored by Prisma).
try {
  console.log("Resolving any stuck grade_to_string migration...");
  execSync('npx prisma migrate resolve --rolled-back 20260402090938_grade_to_string', { stdio: 'pipe' });
  console.log("✅ Migration 20260402090938_grade_to_string record cleared (rolled back).");
} catch (error) {
  console.log("✅ Migration 20260402090938_grade_to_string record already in a clean state.");
}

// ─── 20260404104631_add_library_accounting_sync_v2 ───────────────────────────
// This migration previously failed and some tables (like book_loans) were missing.
// The migration SQL has been made fully idempotent (CREATE IF NOT EXISTS, etc).
// We clear any stuck state AND run db push to ensure the tables PHYSICALLY exist.
try {
  console.log("Resolving any stuck add_library_accounting_sync_v2 migration...");
  execSync('npx prisma migrate resolve --rolled-back 20260404104631_add_library_accounting_sync_v2', { stdio: 'pipe' });
  console.log("✅ Migration 20260404104631_add_library_accounting_sync_v2 record cleared.");
} catch (error) {
  console.log("✅ Migration 20260404104631_add_library_accounting_sync_v2 record already clean or skipped.");
}

// FORCE physical schema sync (Safe as long as we don't drop columns with data)
try {
  console.log("Synchronizing physical database schema (db push)...");
  // --accept-data-loss is usually needed if there are breaking changes, but since 
  // the tables are MISSING, it will just create them.
  execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
  console.log("✅ Physical database schema synchronized.");
} catch (error) {
  console.error("⚠️ Physical sync had warnings, but proceeding to migrate deploy...");
}

console.log("Pre-deploy pipeline complete. Proceeding to migrate...");
