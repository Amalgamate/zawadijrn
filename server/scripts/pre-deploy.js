const { execSync } = require('child_process');

console.log("Running pre-deploy verification...");

try {
  // If the migration failed previously, this commands Prisma to mark it as rolled back safely
  // so that the next `prisma migrate deploy` steps try to apply it again correctly from scratch.
  console.log("Resolving any stuck summative migrations...");
  execSync('npx prisma migrate resolve --rolled-back 20260402074726_summative_hardening', { stdio: 'pipe' });
  console.log("✅ Stuck migration record cleared");
} catch (error) {
  // If it fails, that means the migration wasn't stuck (e.g. fresh DB or already resolved)
  console.log("✅ No stuck migration found or already resolved.");
}

console.log("Pre-deploy pipeline complete. Proceeding to migrate...");
