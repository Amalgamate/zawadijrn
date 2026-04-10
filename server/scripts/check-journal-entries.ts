import prisma from '../src/config/database';

async function run() {
  const entries = await prisma.journalEntry.findMany({
    include: { journal: true, items: { include: { account: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  });
  console.log('journal entries:', entries.length);
  entries.forEach((e) => {
    console.log('ENTRY', e.id, e.reference, e.date.toISOString(), e.status, e.journal?.code);
  });

  const payments = await prisma.feePayment.findMany({
    orderBy: { paymentDate: 'desc' },
    take: 50,
  });
  console.log('fee payments:', payments.length);
  payments.forEach((p) => {
    console.log('PAY', p.id, p.receiptNumber, p.paymentMethod, p.amount, p.paymentDate?.toISOString());
  });

  const termConfigs = await prisma.termConfig.findMany({
    where: { academicYear: 2026 },
    orderBy: { term: 'asc' },
  });
  console.log('term configs:', termConfigs.length);
  termConfigs.forEach((t) => {
    console.log('TERM', t.term, t.academicYear, t.startDate?.toISOString(), t.endDate?.toISOString(), 'active', t.isActive);
  });

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
