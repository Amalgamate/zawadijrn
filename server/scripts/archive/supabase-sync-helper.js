#!/usr/bin/env node
/**
 * Zawadi SMS - Supabase Data Sync Helper
 * 
 * For Supabase projects, get connection string and sync data
 * 
 * Usage:
 *   node supabase-sync-helper.js
 */

const https = require('https');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function log(msg, type = 'info') {
  const emoji = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  const color = { info: colors.cyan, success: colors.green, error: colors.red, warn: colors.yellow };
  console.log(`${color[type]}${emoji[type]} ${msg}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.bold}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bold}${title}${colors.reset}`);
  console.log(`${colors.bold}${'═'.repeat(70)}${colors.reset}\n`);
}

async function main() {
  section('🔄 Zawadi SMS - Supabase Data Sync Helper');

  // Known Supabase project details
  const supabaseProject = {
    ref: 'jpngcprtuqfrjjqgoyvq',
    url: 'https://jpngcprtuqfrjjqgoyvq.supabase.co',
    region: 'eu-west-1 (Ireland)',
    provider: 'aws',
  };

  log(`Project Reference: ${supabaseProject.ref}`, 'info');
  log(`Project URL: ${supabaseProject.url}`, 'info');
  log(`Region: ${supabaseProject.region}`, 'info');

  section('📍 Getting Production Database Connection String');

  log('To get your production connection string:', 'info');
  console.log(`
  1. Go to Supabase: https://app.supabase.com
  2. Select project: ${supabaseProject.ref}
  3. Left sidebar → Database → "Connection pooling" or "Connection parameters"
  4. Copy the "Connection string" (usually starts with postgresql://...)
  5. Choose pooler mode (Session or Transaction)
  
  The connection string format:
  postgresql://postgres:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
  
  Port 6543 = Pooler (recommended for Node.js)
  Port 5432 = Direct connection
`);

  section('🔧 Quick Setup Instructions');

  console.log(`${colors.bold}Step 1: Get your connection string from Supabase${colors.reset}
  Visit: ${colors.cyan}https://app.supabase.com${colors.reset} → Authentication → Database
  
${colors.bold}Step 2: Set environment variable${colors.reset}
  ${colors.yellow}$env:PROD_DATABASE_URL="postgresql://..."${colors.reset}
  
${colors.bold}Step 3: Run sync (Prisma method - easiest)${colors.reset}
  ${colors.yellow}cd server && node sync-prisma.js${colors.reset}
  
${colors.bold}Step 4: Verify${colors.reset}
  ${colors.yellow}psql -U postgres -d zawadi_sms -c "SELECT COUNT(*) FROM learners;"${colors.reset}
`);

  section('📋 Available Sync Tools');

  const tools = [
    {
      name: 'sync-prisma.js',
      desc: 'Recommended - Uses Prisma ORM to sync data',
      cmd: 'node sync-prisma.js',
      need: 'PROD_DATABASE_URL env var',
    },
    {
      name: 'sync-data.js',
      desc: 'Advanced - Uses pg_dump for full backup',
      cmd: 'node sync-data.js --dump',
      need: 'PROD_DB_* env vars (host, port, user, password)',
    },
  ];

  tools.forEach(tool => {
    console.log(`${colors.green}→ ${tool.name}${colors.reset}`);
    console.log(`  ${tool.desc}`);
    console.log(`  Command: ${colors.cyan}${tool.cmd}${colors.reset}`);
    console.log(`  Requires: ${tool.need}`);
    console.log();
  });

  section('🎯 Next Steps');

  console.log(`
1. Get your Supabase connection string (from app.supabase.com)

2. Set the environment variable:
   ${colors.cyan}$env:PROD_DATABASE_URL="postgresql://..."${colors.reset}

3. Run the sync (recommended method):
   ${colors.cyan}cd server && node sync-prisma.js${colors.reset}

4. Wait for completion (2-5 minutes)

5. Verify:
   ${colors.cyan}psql -U postgres -d zawadi_sms -c "SELECT COUNT(*) FROM learners;"${colors.reset}

✅ Your local database will now have production data!
`);

  section('❓ Common Issues');

  console.log(`
${colors.bold}Q: Where do I find the password?${colors.reset}
A: In Supabase Dashboard → Project Settings → Database → Show password

${colors.bold}Q: Do I need to authenticate with Supabase CLI?${colors.reset}
A: Only if using \`supabase db pull\` method. Prisma method doesn't need CLI auth.

${colors.bold}Q: Will this affect production data?${colors.reset}
A: No, it's read-only. Only your local database is modified.

${colors.bold}Q: Can I sync just specific tables?${colors.reset}
A: Edit sync-prisma.js and modify SYNC_TABLES array

${colors.bold}Q: How big is the database?${colors.reset}
A: Usually 500MB-1GB. Check available disk space.

${colors.bold}Q: How often can I sync?${colors.reset}
A: Anytime! Just re-run the command. It overwrites local data.
`);

  log('\nReady to sync? Get your credentials and run: node sync-prisma.js', 'success');
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
