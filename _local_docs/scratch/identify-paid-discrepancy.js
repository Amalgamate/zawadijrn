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

  const excelPaid = [];
  ws.eachRow((row, n) => {
    if (n <= 2) return;
    const vals = row.values.slice(1);
    if (vals[1] === 'TOTAL' || !vals[2]) return;
    
    // Header says Column 7 is paid, but we found Column 7 is Balance and Column 8 is Paid.
    // In our Excel logic: Index 7 is Outstanding Balance.
    const balance = Number(vals[7]) || 0;
    if (balance <= 0) {
      excelPaid.push({ 
        admNo: String(vals[2]).trim().replace('.0', ''), 
        name: vals[1],
        actualBalance: balance
      });
    }
  });

  console.log(`--- Students Fully Paid in Excel (${excelPaid.length} total) ---`);
  
  for (const p of excelPaid) {
    const inv = await prisma.feeInvoice.findFirst({
      where: {
        invoiceNumber: `INV-2026-MIGR-${p.admNo}`
      }
    });

    if (!inv) {
      console.log(`❌ ${p.name} (${p.admNo}): NOT_MIGRATED (Learner probably archived or missing in DB)`);
    } else {
      console.log(`✅ ${p.name} (${p.admNo}): Status=${inv.status}, Balance=${inv.balance}`);
    }
  }
  
  await prisma.$disconnect();
}

run().catch(console.error);
