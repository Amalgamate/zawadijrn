
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const learnerCount = await prisma.learner.count({ where: { status: 'ACTIVE', archived: false } });
  const invoiceCount = await prisma.feeInvoice.count({ where: { term: 'TERM_1', academicYear: 2026, archived: false } });
  const invoiceSums = await prisma.feeInvoice.aggregate({
    where: { term: 'TERM_1', academicYear: 2026, archived: false },
    _sum: { totalAmount: true, paidAmount: true, balance: true }
  });
  
  console.log(JSON.stringify({
    learnerCount,
    invoiceCount,
    invoiceSums
  }, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
