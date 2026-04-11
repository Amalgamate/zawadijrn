import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.feeInvoice.count();
  console.log('TOTAL INVOICES IN DB:', c);
  await prisma.$disconnect();
}
main();
