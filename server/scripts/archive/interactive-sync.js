#!/usr/bin/env node
/**
 * Zawadi SMS - Interactive Production Data Sync
 * 
 * Guides you through getting production connection and syncing data
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  const color = {
    info: colors.cyan,
    success: colors.green,
    error: colors.red,
    warn: colors.yellow,
  };
  console.log(`${color[type]}${emoji[type]} ${msg}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

async function main() {
  console.clear();
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('═'.repeat(70));
  console.log('🔄 ZAWADI SMS - PRODUCTION DATA SYNC');
  console.log('═'.repeat(70));
  console.log(`${colors.reset}\n`);

  log('This tool will sync your production database to local', 'info');
  log('All you need: Production database connection string', 'info');
  console.log();

  // Step 1: Where is production?
  console.log(`${colors.bold}Where is your production database?${colors.reset}`);
  console.log('1) Render (https://dashboard.render.com)');
  console.log('2) Supabase (https://app.supabase.com)');
  console.log('3) I have the connection string already\n');

  rl.question('Choose (1, 2, or 3): ', async (choice) => {
    let connectionString;

    if (choice === '1') {
      showRenderInstructions();
      rl.question(
        `${colors.yellow}Paste connection string: ${colors.reset}`,
        async (str) => {
          connectionString = str;
          await runSync(connectionString);
        }
      );
    } else if (choice === '2') {
      showSupabaseInstructions();
      rl.question(
        `${colors.yellow}Paste connection string: ${colors.reset}`,
        async (str) => {
          connectionString = str;
          await runSync(connectionString);
        }
      );
    } else if (choice === '3') {
      rl.question(
        `${colors.yellow}Paste connection string: ${colors.reset}`,
        async (str) => {
          connectionString = str;
          await runSync(connectionString);
        }
      );
    } else {
      log('Invalid choice', 'error');
      rl.close();
    }
  });
}

function showRenderInstructions() {
  console.log(`
${colors.bold}📍 RENDER INSTRUCTIONS:${colors.reset}

1. Go to https://dashboard.render.com
2. Select your Zawadi SMS backend service
3. Click the service name to open details
4. Scroll down and find your ${colors.cyan}DATABASE_URL${colors.reset}
5. Copy the entire URL

It will look like:
postgresql://user:password@host.render.com:5432/database

${colors.yellow}Paste it below...${colors.reset}
`);
}

function showSupabaseInstructions() {
  console.log(`
${colors.bold}📍 SUPABASE INSTRUCTIONS:${colors.reset}

1. Go to https://app.supabase.com
2. Select project: jpngcprtuqfrjjqgoyvq
3. Left sidebar → ${colors.cyan}Database${colors.reset}
4. Click ${colors.cyan}Connection Pooling${colors.reset} (recommended for Node.js)
5. Select ${colors.cyan}Session${colors.reset} mode
6. Copy the connection string

It will look like:
postgresql://postgres:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres

${colors.yellow}Paste it below...${colors.reset}
`);
}

async function runSync(connectionString) {
  if (!connectionString || !connectionString.includes('postgresql://')) {
    log('Invalid connection string', 'error');
    rl.close();
    process.exit(1);
  }

  // Validate format
  if (!connectionString.includes('@')) {
    log('Connection string missing host information', 'error');
    rl.close();
    process.exit(1);
  }

  log(`Sync starting with: ${connectionString.replace(/:.*@/, ':***@')}`, 'info');
  console.log();

  try {
    // Create env file for sync
    const env = {
      ...process.env,
      PROD_DATABASE_URL: connectionString,
    };

    log('Syncing data (this may take 2-5 minutes)...', 'info');
    console.log();

    // Run sync
    execSync('node sync-prisma.js', {
      cwd: __dirname,
      env,
      stdio: 'inherit',
    });

    console.log();
    log('✨ Data sync complete!', 'success');
    log('Your local database now has production data', 'success');
    console.log();
    log('You can now:', 'info');
    console.log('  • Test locally with real data');
    console.log('  • Develop features safely');
    console.log('  • Debug using actual records');
    console.log();
    log('To sync again anytime, just run this script again!', 'info');
  } catch (error) {
    log(`Sync failed: ${error.message}`, 'error');
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log('• Check that PostgreSQL is running locally');
    console.log('• Verify connection string is correct');
    console.log('• Ensure you have disk space available (1-2GB)');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Start the script
main();
