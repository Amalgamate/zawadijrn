const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== DETAILED SCHEMA AUDIT ===\n');
    
    // Get critical tables and their columns
    const tables = [
      'summative_tests',
      'summative_results',
      'events',
      'grading_ranges',
      'users',
      'learners',
      'classes',
      'payroll_records'
    ];
    
    for (const table of tables) {
      const columns = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position;
      `;
      
      console.log(`\n${table.toUpperCase()} (${columns.length} columns)`);
      console.log('='.repeat(80));
      
      columns.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? '✓ NULL' : '  NOT NULL';
        console.log(`${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${nullable}`);
      });
    }
    
    // Check for constraints
    console.log('\n\n=== FOREIGN KEY CONSTRAINTS ===\n');
    
    const fks = await prisma.$queryRaw`
      SELECT 
        constraint_name,
        table_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = 'public'
        AND referenced_table_name IS NOT NULL
      ORDER BY table_name, column_name;
    `;
    
    console.log(`Total Foreign Keys: ${fks.length}\n`);
    
    // Group by table
    const fksByTable = {};
    fks.forEach(fk => {
      if (!fksByTable[fk.table_name]) {
        fksByTable[fk.table_name] = [];
      }
      fksByTable[fk.table_name].push(fk);
    });
    
    Object.entries(fksByTable).forEach(([table, fkList]) => {
      console.log(`\n${table}:`);
      fkList.forEach(fk => {
        console.log(`  → ${fk.column_name} → ${fk.referenced_table_name}(${fk.referenced_column_name})`);
      });
    });
    
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
