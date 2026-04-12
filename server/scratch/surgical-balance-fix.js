const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');

async function run() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=20"
      }
    }
  });

  const FILE_PATH = 'c:/Amalgamate/Projects/Zawadi SMS/data/Fee_Collection_Score_-_Term_1__2026__04-08-2026_.xlsx';
  console.log('🚀 Starting surgical data correction from Excel source...');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE_PATH);
  const ws = wb.worksheets[0];

  const rows = [];
  ws.eachRow((row, n) => {
    if (n <= 2) return; // skip headers
    const vals = row.values.slice(1);
    const admNo = String(vals[2] || '').trim().replace('.0', '');
    if (admNo) {
      rows.push({
        admNo,
        name: vals[1],
        totalBilled: Number(vals[6]) || 0,
        balance: Number(vals[7]) || 0,
        paid: Number(vals[8]) || 0
      });
    }
  });

  console.log(`Parsed ${rows.length} students from Excel. Updating remote database...`);

  let updated = 0;
  for (const row of rows) {
    const invoice = await prisma.feeInvoice.findFirst({
      where: {
        invoiceNumber: `INV-2026-MIGR-${row.admNo}`
      }
    });

    if (invoice) {
      const dbTotal = Number(invoice.totalAmount);
      const dbPaid = Number(invoice.paidAmount);
      
      // The core fix: ensure totalAmount is from column 6 and paidAmount is from column 8
      // And recalculated balance is total - paid
      const expectedBal = row.totalBilled - row.paid;

      await prisma.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          totalAmount: row.totalBilled,
          paidAmount:  row.paid,
          balance:     expectedBal
        }
      });
      updated++;
      
      if (row.admNo === '1049') {
        console.log(`Debug Ramadhan Mohamed (1049): ExcelBilled=${row.totalBilled}, ExcelPaid=${row.paid}, NewBalance=${expectedBal}`);
      }
    }
  }

  console.log(`✅ Success! Performed surgical correction on ${updated} remote invoices.`);
  await prisma.$disconnect();
}

run().catch(console.error);
