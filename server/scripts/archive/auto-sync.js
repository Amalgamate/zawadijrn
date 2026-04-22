#!/usr/bin/env node
/**
 * Auto-construct Supabase connection string from .env
 * Then run sync
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL not found in .env');
  process.exit(1);
}

console.log('✅ Found Supabase project in .env');
console.log(`   URL: ${supabaseUrl}`);

// Supabase pooler connection format
const poolerUrl = 'postgresql://postgres:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

console.log('\n📍 To complete sync, we need the database password\n');
console.log('You can get it from:\n');
console.log('1. Supabase Dashboard → Project Settings → Database → Show password');
console.log('2. Render Environment Variables (if stored there)');
console.log('3. Your secure password manager\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter Supabase database password: ', (password) => {
  if (!password) {
    console.log('❌ Password required');
    rl.close();
    process.exit(1);
  }

  const prodUrl = poolerUrl.replace('[PASSWORD]', password);
  
  try {
    console.log('\n🔄 Starting sync with production database...\n');
    
    // Set env and run sync
    process.env.PROD_DATABASE_URL = prodUrl;
    
    // Import and run sync directly
    const syncModule = require('./sync-prisma.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
});
