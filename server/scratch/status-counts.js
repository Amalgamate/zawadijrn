const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=20"
    }
  }
});

async function run() {
  const stats = await prisma.feeInvoice.groupBy({
    by: ['status'],
    where: {
      invoiceNumber: { startsWith: 'INV-2026-MIGR-' }
    },
    _count: {
      id: true
    }
  });

  console.log('--- Migrated Invoice Status Counts ---');
  stats.forEach(s => {
    console.log(`${s.status}: ${s._count.id}`);
  });
  
  await prisma.$disconnect();
}

run().catch(console.error);
