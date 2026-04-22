const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get database tables
    const dbTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    const dbTableNames = new Set(dbTables.map(t => t.table_name));
    
    // Get Prisma models
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const modelMatches = schemaContent.match(/^model\s+(\w+)\s*{/gm);
    const models = modelMatches.map(m => m.replace(/^model\s+/, '').replace(/\s*{$/, '')).sort();
    
    // Build mapping
    const modelToTable = {};
    models.forEach(model => {
      const regex = new RegExp(`model\\s+${model}\\s*{[^}]*@@map\\("([^"]+)"\\)`, 's');
      const match = schemaContent.match(regex);
      if (match) {
        modelToTable[model] = match[1];
      } else {
        const snake = model
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '');
        modelToTable[model] = snake + 's';
      }
    });
    
    console.log('=== DATABASE TABLE COMPARISON ===\n');
    console.log(`Database Tables: ${dbTableNames.size}`);
    console.log(`Prisma Models:   ${models.length}\n`);
    
    // Find missing tables
    const expectedTables = Object.values(modelToTable);
    const missingTables = expectedTables.filter(t => !dbTableNames.has(t));
    const extraTables = Array.from(dbTableNames).filter(t => !expectedTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('❌ MISSING TABLES (in Prisma schema but NOT in database):');
      console.log('============================================================\n');
      missingTables.forEach((t, idx) => {
        const model = Object.entries(modelToTable).find(([_, table]) => table === t)?.[0];
        console.log(`${idx + 1}. ${t.padEnd(40)} ← ${model}`);
      });
      console.log(`\nTotal Missing: ${missingTables.length}\n`);
    } else {
      console.log('✅ All Prisma models have corresponding database tables!\n');
    }
    
    if (extraTables.length > 0) {
      console.log('⚠️ EXTRA TABLES (in database but NOT in Prisma schema):');
      console.log('=========================================================\n');
      extraTables.forEach((t, idx) => {
        console.log(`${idx + 1}. ${t}`);
      });
      console.log(`\nTotal Extra: ${extraTables.length}\n`);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
