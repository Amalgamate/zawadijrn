#!/usr/bin/env node
/**
 * ONE STEP: Copy the connection string from Supabase and paste below
 * 
 * Quick shortcut to set env var and run sync
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n🔄 Zawadi SMS - One Step Data Sync\n');
console.log('=' .repeat(65));
console.log('From your Supabase dashboard (Database → Connection Pooling):');
console.log('Copy the connection string and paste below\n');

rl.question('Paste connection string here: ', (connectionString) => {
  if (!connectionString || !connectionString.includes('postgresql://')) {
    console.log('❌ Invalid connection string');
    rl.close();
    process.exit(1);
  }

  try {
    console.log('\n✅ Connection string received');
    console.log('🔄 Starting data sync...\n');
    
    // Set env var and run sync
    const cmd = `set PROD_DATABASE_URL=${connectionString} && node sync-prisma.js`;
    execSync(cmd, { 
      cwd: __dirname,
      stdio: 'inherit',
      shell: 'cmd.exe'
    });
    
    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
});
