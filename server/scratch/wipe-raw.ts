import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const YEAR = 2026;

  try {
    console.log(`🚀 Starting Raw SQL Wipe for Academic Year ${YEAR}...`);

    // 1. Delete payments linked to 2026 invoices
    const pCount = await prisma.$executeRaw`
      DELETE FROM fee_payments 
      WHERE "invoiceId" IN (
        SELECT id FROM fee_invoices 
        WHERE "feeStructureId" IN (
          SELECT id FROM fee_structures 
          WHERE "academicYear" = ${YEAR}
        )
      )
    `;
    console.log(`✅ Deleted ${pCount} payments.`);

    // 2. Delete invoices linked to 2026 structures
    const iCount = await prisma.$executeRaw`
      DELETE FROM fee_invoices 
      WHERE "feeStructureId" IN (
        SELECT id FROM fee_structures 
        WHERE "academicYear" = ${YEAR}
      )
    `;
    console.log(`✅ Deleted ${iCount} invoices.`);

    // 3. Delete items for 2026 structures
    const itCount = await prisma.$executeRaw`
      DELETE FROM fee_structure_items 
      WHERE "feeStructureId" IN (
        SELECT id FROM fee_structures 
        WHERE "academicYear" = ${YEAR}
      )
    `;
    console.log(`✅ Deleted ${itCount} items.`);

    // 4. Delete 2026 structures
    const sCount = await prisma.$executeRaw`
      DELETE FROM fee_structures 
      WHERE "academicYear" = ${YEAR}
    `;
    console.log(`✅ Deleted ${sCount} structures.`);

    console.log('✨ CLEANUP COMPLETE.');
  } catch (error) {
    console.error('❌ Error during wipe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
