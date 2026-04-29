import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const waivers = await prisma.feeWaiver.findMany({
    include: { invoice: true }
  });

  console.log('All Waivers in System:');
  for (const w of waivers) {
    console.log(`ID: ${w.id} | Amount: ${w.amountWaived} | Status: ${w.status} | Invoice: ${w.invoice.invoiceNumber}`);
  }
}

main().finally(() => prisma.$disconnect());
