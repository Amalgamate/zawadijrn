import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const YEAR_TO_WIPE = 2026;

  try {
    console.log(`🚀 STARTING SURGICAL WIPE OF ${YEAR_TO_WIPE} FEE DATA...`);

    // 1. Find all 2026 structures first
    const structures2026 = await prisma.feeStructure.findMany({
      where: { academicYear: YEAR_TO_WIPE },
      select: { id: true }
    });
    const structureIds = structures2026.map(s => s.id);

    if (structureIds.length === 0) {
      console.log('✅ No 2026 structures found. Done.');
      return;
    }

    // 2. Find all invoices linked to these structures
    const linkedInvoices = await prisma.feeInvoice.findMany({
      where: { feeStructureId: { in: structureIds } },
      select: { id: true }
    });
    const invoiceIds = linkedInvoices.map(inv => inv.id);

    if (invoiceIds.length > 0) {
      console.log(`🗑️  Deleting Payments for ${invoiceIds.length} linked invoices...`);
      const paymentResult = await prisma.feePayment.deleteMany({
        where: { invoiceId: { in: invoiceIds } }
      });
      console.log(`✅ Deleted ${paymentResult.count} payments.`);

      console.log(`🗑️  Deleting ${invoiceIds.length} linked invoices...`);
      const invoiceResult = await prisma.feeInvoice.deleteMany({
        where: { id: { in: invoiceIds } }
      });
      console.log(`✅ Deleted ${invoiceResult.count} invoices.`);
    }

    // 3. Delete items and the structures themselves
    console.log(`🗑️  Deleting FeeStructureItems for ${structureIds.length} structures...`);
    const itemResult = await prisma.feeStructureItem.deleteMany({
      where: { feeStructureId: { in: structureIds } }
    });
    console.log(`✅ Deleted ${itemResult.count} items.`);

    console.log(`🗑️  Deleting ${structureIds.length} structures...`);
    const structResult = await prisma.feeStructure.deleteMany({
      where: { id: { in: structureIds } }
    });
    console.log(`✅ Deleted ${structResult.count} structures.`);

    console.log('✨ CLEANUP COMPLETE. DATABASE IS READY FOR RE-SEEDING.');

  } catch (error) {
    console.error('❌ FATAL ERROR DURING WIPE:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
