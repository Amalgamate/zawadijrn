import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('--- Diagnosis ---');
    const structs = await prisma.feeStructure.findMany({
      where: { academicYear: 2026 },
      include: { feeItems: true }
    });
    console.log(`Found ${structs.length} structures for 2026`);
    structs.forEach(s => {
      console.log(`- Grade: ${s.grade}, ID: ${s.id}, Items: ${s.feeItems.length}`);
    });

    const learners = await prisma.learner.findMany({
        take: 5,
        select: { id: true, admissionNumber: true, grade: true }
    });
    console.log('Sample Learners:', learners);

    const invoices = await prisma.feeInvoice.findMany({
        where: { academicYear: 2026 },
        take: 5
    });
    console.log('Sample Invoices 2026:', invoices);

  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
