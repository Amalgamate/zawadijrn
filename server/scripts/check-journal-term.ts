import prisma from '../src/config/database';

async function run() {
  const statusCounts = await prisma.journalEntry.groupBy({
    by: ['status'],
    _count: { _all: true }
  });
  console.log('status counts', statusCounts);

  const samples = await prisma.journalEntry.findMany({
    where: { status: 'POSTED' },
    orderBy: { date: 'desc' },
    take: 20,
    include: { journal: true }
  });
  console.log('sample posted entries');
  samples.forEach((e) => console.log(e.date.toISOString(), e.reference, e.journal.code));

  const termConfig = await prisma.termConfig.findUnique({
    where: { academicYear_term: { academicYear: 2026, term: 'TERM_1' } }
  });
  console.log('term config', termConfig?.startDate.toISOString(), termConfig?.endDate.toISOString());

  const countInTerm = await prisma.journalEntry.count({
    where: {
      status: 'POSTED',
      date: {
        gte: termConfig?.startDate,
        lte: termConfig?.endDate
      }
    }
  });
  console.log('count in term1 2026', countInTerm);

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});