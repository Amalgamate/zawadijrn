const { PrismaClient } = require('@prisma/client');

// Explicitly pass the remote URL to the constructor to ensure we are hitting the right DB
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=20"
    }
  }
});

async function run() {
  console.log('🚀 Starting surgical balance correction on REMOTE Supabase DB...');
  
  // Find all invoices created by the migration script
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
    const storedBal = Number(inv.balance);
    
    // Correct balance calculation: Total - Paid
    const expectedBal = total - paid;

    // We force update ALL migration invoices to the correct absolute balance
    // This removes the "1" and "0.97" ratios
    await prisma.feeInvoice.update({
      where: { id: inv.id },
      data: { balance: expectedBal }
    });
    correctedCount++;
    
    if (inv.invoiceNumber === 'INV-2026-MIGR-1060') {
      console.log(`Debug Mahir Ahmed: Total=${total}, Paid=${paid}, OldBal=${storedBal}, NewBal=${expectedBal}`);
    }
  }

  console.log(`✅ Success! Corrected ${correctedCount} invoices on the remote database.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
