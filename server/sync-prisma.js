#!/usr/bin/env node
/**
 * Zawadi SMS Data Sync - Prisma ORM Edition
 * 
 * This approach:
 * - Uses Prisma to read from production (via environment override)
 * - Writes to local database
 * - No pg_dump required, just database URLs
 * 
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." node sync-prisma.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Tables to sync (in order to respect foreign keys)
const SYNC_TABLES = [
  'schools',
  'users', 
  'learners',
  'streams',
  'classes',
  'learning_areas',
  'summative_tests',
  'grading_systems',
  'grading_ranges',
  'summative_results',
  'formative_assessments',
  'events',
  'payroll_records',
];

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(msg, type = 'info') {
  const emoji = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  const color = { info: colors.cyan, success: colors.green, error: colors.red, warn: colors.yellow };
  console.log(`${color[type]}${emoji[type]} ${msg}${colors.reset}`);
}

async function syncData() {
  // Detect if we should use production URL from environment
  const prodUrl = process.env.PROD_DATABASE_URL;
  const localUrl = process.env.DATABASE_URL;

  if (!prodUrl) {
    log('PROD_DATABASE_URL environment variable not set', 'error');
    log('Set it before running: $env:PROD_DATABASE_URL="postgresql://..."', 'warn');
    process.exit(1);
  }

  log('🔄 Zawadi SMS Data Sync (Prisma ORM)', 'info');
  console.log('═'.repeat(65));
  log(`Source (Production): ${prodUrl.replace(/:[^:]*@/, ':***@')}`, 'info');
  log(`Target (Local):      ${localUrl.replace(/:[^:]*@/, ':***@')}`, 'info');

  // Create two Prisma clients
  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodUrl } },
  });

  const localPrisma = new PrismaClient({
    datasources: { db: { url: localUrl } },
  });

  let totalSynced = 0;
  const startTime = Date.now();

  try {
    for (const table of SYNC_TABLES) {
      try {
        log(`Syncing ${table}...`, 'info');

        // Get all records from production
        const records = await prodPrisma.$queryRawUnsafe(`SELECT * FROM "${table}";`);
        
        if (records.length === 0) {
          log(`  (empty table, skipping)`, 'warn');
          continue;
        }

        // Clear local table
        await localPrisma.$queryRawUnsafe(`TRUNCATE "${table}" CASCADE;`);

        // Batch insert to local (1000 at a time)
        for (let i = 0; i < records.length; i += 1000) {
          const batch = records.slice(i, i + 1000);
          const keys = Object.keys(batch[0]);
          const values = batch
            .map(row => {
              const vals = keys.map(k => {
                const v = row[k];
                if (v === null) return 'NULL';
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                if (typeof v === 'boolean') return v ? 'true' : 'false';
                if (Array.isArray(v)) return `'${JSON.stringify(v)}'::jsonb`;
                if (typeof v === 'object') return `'${JSON.stringify(v)}'::jsonb`;
                return String(v);
              });
              return `(${vals.join(',')})`;
            })
            .join(',');

          const sql = `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(',')}) VALUES ${values} ON CONFLICT DO NOTHING;`;
          await localPrisma.$queryRawUnsafe(sql);
        }

        log(`  ✓ Synced ${records.length} records`, 'success');
        totalSynced += records.length;
      } catch (e) {
        log(`  ⚠️  Skipped ${table} (${e.message})`, 'warn');
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(65));
    log(`Synced ${totalSynced} records in ${elapsed}s`, 'success');
    log('Local database is now synced with production!', 'success');
  } catch (error) {
    log(`Sync failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

syncData();
