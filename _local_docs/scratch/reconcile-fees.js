const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=20"
    }
  }
});

async function run() {
  const FILE_PATH = 'c:/Amalgamate/Projects/Zawadi SMS/data/Fee_Collection_Score_-_Term_1__2026__04-08-2026_.xlsx';
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE_PATH);
  const ws = wb.worksheets[0];

  let excelTotalBilled = 0;
  let excelTotalPaid = 0;
  let excelTotalBalance = 0;
  
  let migratedTotalBilled = 0;
  let migratedTotalPaid = 0;
  let migratedTotalBalance = 0;
  
  let skippedTotalBilled = 0;
  let skippedTotalPaid = 0;
  let skippedCount = 0;
  const skippedList = [];

  const rows = [];
  ws.eachRow((row, n) => {
    if (n <= 2) return;
    const vals = row.values.slice(1);
    if (vals[1] === 'TOTAL' || !vals[2]) return;
    
    const billed = Number(vals[6]) || 0;
    const balance = Number(vals[7]) || 0;
    const paid = Number(vals[8]) || 0;
    
    excelTotalBilled += billed;
    excelTotalPaid += paid;
    excelTotalBalance += balance;
    
    rows.push({ admNo: String(vals[2]).trim().replace('.0', ''), billed, paid, balance, name: vals[1] });
  });

  for (const row of rows) {
    const learner = await prisma.learner.findUnique({
      where: { admissionNumber: row.admNo },
      select: { id: true, archived: true }
    });

    if (learner && !learner.archived) {
      migratedTotalBilled += row.billed;
      migratedTotalPaid += row.paid;
      migratedTotalBalance += (row.billed - row.paid);
    } else {
      skippedCount++;
      skippedTotalBilled += row.billed;
      skippedTotalPaid += row.paid;
      skippedList.push(`${row.admNo}: ${row.name} (Billed: ${row.billed}, Paid: ${row.paid})`);
    }
  }

  console.log('--- Reconciliation Summary ---');
  console.log(`Excel Billed (sum): ${excelTotalBilled.toLocaleString()}`);
  console.log(`Excel Paid (sum):   ${excelTotalPaid.toLocaleString()}`);
  console.log(`Excel Balance (sum): ${excelTotalBalance.toLocaleString()}`);
  console.log('');
  console.log(`Migrated Billed: ${migratedTotalBilled.toLocaleString()}`);
  console.log(`Migrated Paid:   ${migratedTotalPaid.toLocaleString()}`);
  console.log('');
  console.log(`Skipped Count: ${skippedCount}`);
  console.log(`Skipped Billed: ${skippedTotalBilled.toLocaleString()}`);
  console.log(`Skipped Paid:   ${skippedTotalPaid.toLocaleString()}`);
  console.log('');
  if (skippedList.length > 0) {
    console.log('Top 5 Skipped Students:');
    skippedList.slice(0, 5).forEach(s => console.log(`  ${s}`));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
