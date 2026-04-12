const { PrismaClient, PaymentStatus } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=20"
    }
  }
});

async function run() {
  console.log('🔄 Syncing invoice statuses with actual balances on REMOTE DB...');
  
  const invoices = await prisma.feeInvoice.findMany({
    where: {
      invoiceNumber: { startsWith: 'INV-2026-MIGR-' }
    }
  });

  let updated = 0;
  for (const inv of invoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const balance = Number(inv.balance);
    
    let newStatus = inv.status;

    if (balance < 0) {
      newStatus = PaymentStatus.OVERPAID;
    } else if (balance === 0) {
      newStatus = PaymentStatus.PAID;
    } else if (paid > 0) {
      newStatus = PaymentStatus.PARTIAL;
    } else {
      newStatus = PaymentStatus.PENDING;
    }

    if (newStatus !== inv.status) {
      await prisma.feeInvoice.update({
        where: { id: inv.id },
        data: { status: newStatus }
      });
      updated++;
    }
  }

  console.log(`✅ Success! Updated statuses for ${updated} remote invoices.`);
  
  // Also run on LOCAL
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:postgres@localhost:5432/zawadi_sms?schema=public"
      }
    }
  });
  
  console.log('🔄 Syncing invoice statuses on LOCAL DB...');
  const localInvoices = await localPrisma.feeInvoice.findMany({
    where: { invoiceNumber: { startsWith: 'INV-2026-MIGR-' } }
  });

  let localUpdated = 0;
  for (const inv of localInvoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const balance = Number(inv.balance);
    
    let newStatus = inv.status;
    if (balance < 0) newStatus = PaymentStatus.OVERPAID;
    else if (balance === 0) newStatus = PaymentStatus.PAID;
    else if (paid > 0) newStatus = PaymentStatus.PARTIAL;
    else newStatus = PaymentStatus.PENDING;

    if (newStatus !== inv.status) {
      await localPrisma.feeInvoice.update({
        where: { id: inv.id },
        data: { status: newStatus }
      });
      localUpdated++;
    }
  }
  console.log(`✅ Success! Updated statuses for ${localUpdated} local invoices.`);

  await prisma.$disconnect();
  await localPrisma.$disconnect();
}

run().catch(console.error);
