#!/usr/bin/env node
/**
 * Zawadi SMS Data Sync Tool
 * Syncs production database data to local instance
 * 
 * Usage:
 *   node sync-data.js              # Full sync (dump and restore)
 *   node sync-data.js --dump       # Only dump production data
 *   node sync-data.js --restore    # Only restore from dump
 *   node sync-data.js --verify     # Compare local vs production row counts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dumpFile = path.join(__dirname, 'data-sync', 'production_dump.sql');
const dumpDir = path.dirname(dumpFile);

// ─── Configuration ────────────────────────────────────────────────────────────
const LOCAL_DB = {
  host: 'localhost',
  port: '5432',
  username: 'postgres',
  password: 'postgres',
  database: 'zawadi_sms',
};

// Production DB - You need to get this from Render environment or Supabase
const PROD_DB = {
  // These would come from Render environment or be provided via CLI
  // For now, we'll use Supabase connection details if available
  host: process.env.PROD_DB_HOST || 'aws-1-eu-west-1.pooler.supabase.com',
  port: process.env.PROD_DB_PORT || '6543',
  username: process.env.PROD_DB_USER || 'postgres',
  password: process.env.PROD_DB_PASSWORD || null,
  database: 'postgres',
};

const args = process.argv.slice(2);
const action = args[0] || 'full';

// ─── Helper Functions ─────────────────────────────────────────────────────────
function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
    reset: '\x1b[0m',
  };
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️',
  };
  console.log(`${colors[type]}${emoji[type]} ${msg}${colors.reset}`);
}

function ensureDumpDir() {
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true });
    log(`Created dump directory: ${dumpDir}`);
  }
}

// ─── Dump Production Data ─────────────────────────────────────────────────────
async function dumpProduction() {
  log('Starting production database dump...', 'info');

  if (!PROD_DB.password) {
    log('⚠️  Production DB password not set in PROD_DB_PASSWORD environment variable', 'warn');
    log('Set PROD_DB_PASSWORD to proceed with dump', 'warn');
    log('Example: $env:PROD_DB_PASSWORD="your-password"; node sync-data.js --dump', 'info');
    return false;
  }

  try {
    ensureDumpDir();

    // Build pg_dump command
    const cmd = [
      'pg_dump',
      `-h ${PROD_DB.host}`,
      `-p ${PROD_DB.port}`,
      `-U ${PROD_DB.username}`,
      `-d ${PROD_DB.database}`,
      `--file="${dumpFile}"`,
      '--schema=public',
      '--verbose',
    ].join(' ');

    log(`Dumping from: ${PROD_DB.username}@${PROD_DB.host}:${PROD_DB.database}`, 'info');

    const env = { ...process.env, PGPASSWORD: PROD_DB.password };
    execSync(cmd, { env, stdio: 'inherit' });

    const fileSize = (fs.statSync(dumpFile).size / 1024 / 1024).toFixed(2);
    log(`Dump completed: ${dumpFile} (${fileSize} MB)`, 'success');
    return true;
  } catch (error) {
    log(`Dump failed: ${error.message}`, 'error');
    return false;
  }
}

// ─── Restore to Local ─────────────────────────────────────────────────────────
async function restoreLocal() {
  log('Starting restore to local database...', 'info');

  if (!fs.existsSync(dumpFile)) {
    log(`Dump file not found: ${dumpFile}`, 'error');
    return false;
  }

  try {
    // Clear local database first
    log('Clearing local database (keeping tables)...', 'info');
    const clearCmd = `psql -h ${LOCAL_DB.host} -p ${LOCAL_DB.port} -U ${LOCAL_DB.username} -d ${LOCAL_DB.database} -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"`;
    const localEnv = { ...process.env, PGPASSWORD: LOCAL_DB.password };
    execSync(clearCmd, { env: localEnv, stdio: 'inherit' });

    // Restore from dump
    log('Restoring data from dump...', 'info');
    const restoreCmd = `psql -h ${LOCAL_DB.host} -p ${LOCAL_DB.port} -U ${LOCAL_DB.username} -d ${LOCAL_DB.database} < "${dumpFile}"`;
    execSync(restoreCmd, { env: localEnv, stdio: 'inherit' });

    log('Restore completed successfully', 'success');
    return true;
  } catch (error) {
    log(`Restore failed: ${error.message}`, 'error');
    return false;
  }
}

// ─── Verify Data Sync ─────────────────────────────────────────────────────────
async function verifySync() {
  log('Verifying data sync...', 'info');

  const tables = [
    'learners', 'users', 'classes', 'summative_tests', 'summative_results',
    'formative_assessments', 'events', 'grading_ranges', 'payroll_records'
  ];

  console.log('\n📊 Row Counts Comparison:');
  console.log('─'.repeat(65));
  console.log(`${'Table'.padEnd(30)} ${'Local'.padStart(12)} ${'Status'.padStart(20)}`);
  console.log('─'.repeat(65));

  try {
    for (const table of tables) {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer as count FROM "${table}";`);
      const count = result[0]?.count || 0;
      const status = count > 0 ? '✅ Has data' : '⚠️  Empty';
      console.log(`${table.padEnd(30)} ${String(count).padStart(12)} ${status.padStart(20)}`);
    }
    console.log('─'.repeat(65));
    log('Verification complete', 'success');
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
  }
}

// ─── Main Execution ───────────────────────────────────────────────────────────
(async () => {
  try {
    log('🔄 Zawadi SMS Data Sync Tool', 'info');
    console.log('═'.repeat(65));

    if (action === 'full' || action === '--dump' || action === '--restore' || action === '--verify') {
      if (action === 'full' || action === '--dump') {
        const dumpOk = await dumpProduction();
        if (!dumpOk && action === 'full') {
          log('Dump failed, exiting...', 'error');
          process.exit(1);
        }
      }

      if (action === 'full' || action === '--restore') {
        const restoreOk = await restoreLocal();
        if (!restoreOk && action === 'full') {
          log('Restore failed, exiting...', 'error');
          process.exit(1);
        }
      }

      if (action === '--verify' || action === 'full') {
        await verifySync();
      }

      if (action === 'full') {
        log('\n✨ Data sync complete!', 'success');
      }
    } else {
      log(`Unknown action: ${action}`, 'error');
      console.log('\nUsage:');
      console.log('  node sync-data.js              # Full sync (dump and restore)');
      console.log('  node sync-data.js --dump       # Only dump production data');
      console.log('  node sync-data.js --restore    # Only restore from dump');
      console.log('  node sync-data.js --verify     # Compare local vs production');
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
