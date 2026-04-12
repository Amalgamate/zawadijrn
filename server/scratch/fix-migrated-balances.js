const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🚀 Starting balance correction for migrated invoices...');
  
  // Find all invoices created by the migration script
  const invoices = await prisma.feeInvoice.findMany({
    where: {
      invoiceNumber: { startsWith: 'INV-2026-MIGR-' }
    }
  });

  console.log(`Found ${invoices.length} migrated invoices. checking for anomalies...`);

  let corrected = 0;
  for (const inv of invoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const storedBal = Number(inv.balance);
    
    // Correct balance calculation
    const expectedBal = total - paid;

    // Check if the stored balance is significantly different (ratio issue)
    // We update all migrated ones just to be safe and consistent
    if (Math.abs(storedBal - expectedBal) > 0.01) {
      await prisma.feeInvoice.update({
        where: { id: inv.id },
        data: { balance: expectedBal }
      });
      corrected++;
    }
  }

  console.log(`✅ Success! Corrected ${corrected} invoices.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
