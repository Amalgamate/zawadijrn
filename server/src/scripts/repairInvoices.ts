import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Fee Invoice Status Repair ---');
  
  const invoices = await prisma.feeInvoice.findMany();
  console.log(`Found ${invoices.length} invoices to process.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const inv of invoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const balance = Number(inv.balance);
    const currentStatus = inv.status;

    let targetStatus: string;

    if (paid > total) {
      targetStatus = 'OVERPAID';
    } else if (balance <= 0) {
      targetStatus = 'PAID';
    } else if (paid > 0) {
      targetStatus = 'PARTIAL';
    } else {
      // Check if there are any waivers that make it partial? 
      // Usually if paid is 0 and balance > 0, it's pending unless some was waived.
      // But let's check waivers to be safe.
      const waivers = await prisma.feeWaiver.findMany({
        where: { invoiceId: inv.id, status: 'APPROVED' }
      });
      const totalWaived = waivers.reduce((sum, w) => sum + Number(w.amountWaived), 0);
      
      if (totalWaived > 0 && balance > 0) {
        targetStatus = 'PARTIAL';
      } else {
        targetStatus = 'PENDING';
      }
    }

    if (currentStatus !== targetStatus) {
      console.log(`Updating Inv #${inv.invoiceNumber}: ${currentStatus} -> ${targetStatus} (Billed: ${total}, Paid: ${paid}, Bal: ${balance})`);
      await prisma.feeInvoice.update({
        where: { id: inv.id },
        data: { status: targetStatus as any }
      });
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('--- Repair Complete ---');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Already Correct: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('Error during repair:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
