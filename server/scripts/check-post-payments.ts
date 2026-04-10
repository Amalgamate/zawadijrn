import prisma from '../src/config/database';
import { accountingService } from '../src/services/accounting.service';

async function run() {
  const payment = await prisma.feePayment.findFirst({ where: { paymentMethod: 'OTHER' } });
  if (!payment) {
    console.log('no payment found');
    process.exit(0);
  }
  console.log('using payment', payment.id, payment.receiptNumber, payment.amount, payment.paymentMethod);
  const result = await accountingService.postFeePaymentToLedger(payment, payment.paymentMethod);
  console.log('post result', result);
  const entries = await prisma.journalEntry.findMany({ include: { journal: true, items: { include: { account: true } } }, orderBy: { date: 'desc' }, take: 10 });
  console.log('entries after post', entries.length);
  entries.forEach(e => console.log(e.reference, e.journal?.code, e.date.toISOString(), e.status));
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
