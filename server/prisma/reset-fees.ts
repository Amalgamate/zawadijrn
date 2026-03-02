import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Resetting Fee Data (Local)...');

    // Deletion Order Matters (FK Constraints)

    console.log('   - Deleting Payments...');
    await prisma.feePayment.deleteMany({});

    console.log('   - Deleting Invoices...');
    await prisma.feeInvoice.deleteMany({});

    console.log('   - Deleting Fee Structure Items...');
    await prisma.feeStructureItem.deleteMany({});

    console.log('   - Deleting Fee Structures...');
    await prisma.feeStructure.deleteMany({});

    console.log('✅ Fees Reset Complete. System is blank.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
