import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING BALANCE POPULATION ---');
  
  // 1. Fetch all Fee Structures for Term 1 2026
  const structures = await prisma.feeStructure.findMany({
    where: { academicYear: 2026, term: 'TERM_1', archived: false },
    include: { feeItems: true }
  });

  const gradeToTotal: Record<string, number> = {};
  const gradeToId: Record<string, string> = {};

  for (const fs of structures) {
    const totalMandatory = fs.feeItems
      .filter(i => i.mandatory !== false)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    
    gradeToTotal[fs.grade] = totalMandatory;
    gradeToId[fs.grade] = fs.id;
    console.log(`Mapped ${fs.grade} to KES ${totalMandatory}`);
  }

  // 2. Fetch all invoices needing update
  const invoices = await prisma.feeInvoice.findMany({
    where: { academicYear: 2026, term: 'TERM_1', totalAmount: 0 },
    include: { learner: true }
  });

  console.log(`\nFound ${invoices.length} invoices to update.`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const inv of invoices) {
    const studentGrade = inv.learner.grade;
    const structureAmount = gradeToTotal[studentGrade];
    const structureId = gradeToId[studentGrade];

    if (structureAmount === undefined) {
      console.warn(`[Invoice ${inv.invoiceNumber}] SKIPPED: No fee structure found for grade ${studentGrade}`);
      errorCount++;
      continue;
    }

    try {
      const newTotal = structureAmount;
      const newPaid = Number(inv.paidAmount);
      const newBalance = Math.max(0, newTotal - newPaid);
      let newStatus = inv.status;

      if (newBalance <= 0) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIAL';
      else newStatus = 'PENDING';

      await prisma.feeInvoice.update({
        where: { id: inv.id },
        data: {
          totalAmount: newTotal,
          balance: newBalance,
          status: newStatus as any,
          feeStructureId: structureId // Ensure it's linked correctly
        }
      });

      updatedCount++;
    } catch (err: any) {
      console.error(`[Invoice ${inv.invoiceNumber}] ERROR:`, err.message);
      errorCount++;
    }
  }

  console.log('\n--- POPULATION SUMMARY ---');
  console.log(`Total Processed: ${invoices.length}`);
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Skipped/Errors: ${errorCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
