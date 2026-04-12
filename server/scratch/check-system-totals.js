const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=20"
    }
  }
});

async function run() {
  const stats = await prisma.feeInvoice.aggregate({
    where: {
      invoiceNumber: { startsWith: 'INV-2026-MIGR-' }
    },
    _sum: {
      totalAmount: true,
      paidAmount: true,
      balance: true
    },
    _count: {
      id: true
    }
  });

  console.log('--- System Totals (Migrated Invoices) ---');
  console.log(`Count: ${stats._count.id}`);
  console.log(`Billed: ${Number(stats._sum.totalAmount).toLocaleString()}`);
  console.log(`Paid:   ${Number(stats._sum.paidAmount).toLocaleString()}`);
  console.log(`Balance: ${Number(stats._sum.balance).toLocaleString()}`);
  
  await prisma.$disconnect();
}

run().catch(console.error);
