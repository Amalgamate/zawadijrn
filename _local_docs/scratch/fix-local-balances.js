const { PrismaClient } = require('@prisma/client');

// Explicitly use the LOCAL database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/zawadi_sms?schema=public"
    }
  }
});

async function run() {
  console.log('🚀 Starting surgical balance correction on LOCAL DB...');
  
  const invoices = await prisma.feeInvoice.findMany({
    where: {
      invoiceNumber: { startsWith: 'INV-2026-MIGR-' }
    }
  });

  console.log(`Found ${invoices.length} migrated invoices. checking for anomalies...`);

  let correctedCount = 0;
  for (const inv of invoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const expectedBal = total - paid;

    await prisma.feeInvoice.update({
      where: { id: inv.id },
      data: { balance: expectedBal }
    });
    correctedCount++;
  }

  console.log(`✅ Success! Corrected ${correctedCount} invoices on the LOCAL database.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
