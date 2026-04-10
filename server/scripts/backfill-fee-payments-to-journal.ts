import prisma from '../src/config/database';
import { accountingService } from '../src/services/accounting.service';

async function run() {
  const payments = await prisma.feePayment.findMany({
    orderBy: { paymentDate: 'asc' },
  });

  if (!payments.length) {
    console.log('No fee payments found.');
    await prisma.$disconnect();
    return;
  }

  const existingReferences = new Set(
    (await prisma.journalEntry.findMany({ select: { reference: true } }))
      .map((entry) => entry.reference)
      .filter((ref): ref is string => Boolean(ref))
  );

  let created = 0;
  for (const payment of payments) {
    if (!payment.receiptNumber) continue;
    if (existingReferences.has(payment.receiptNumber)) {
      continue;
    }

    try {
      await accountingService.postFeePaymentToLedger(payment, payment.paymentMethod || 'CASH');
      console.log('Posted journal entry for payment', payment.receiptNumber);
      created += 1;
    } catch (error) {
      console.error('Failed to post payment', payment.receiptNumber, error);
    }
  }

  console.log(`Backfill complete. Created ${created} journal entries.`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});