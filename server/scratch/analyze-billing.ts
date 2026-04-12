import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- RESEARCH: Fee Structures 2026 Term 1 ---');
  const structures = await prisma.feeStructure.findMany({
    where: { academicYear: 2026, term: 'TERM_1', archived: false },
    include: { feeItems: { include: { feeType: true } } }
  });

  for (const fs of structures) {
    const totalMandatory = fs.feeItems
      .filter(i => i.mandatory !== false)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    
    const transportItem = fs.feeItems.find(i => i.feeType.name.toLowerCase().includes('transport'));
    
    console.log(`- ${fs.grade}: Total Mandatory = KES ${totalMandatory.toLocaleString()} (Transport: ${transportItem ? 'Found' : 'Not Found'})`);
  }

  console.log('\n--- RESEARCH: Invoices with 0 Balances ---');
  const emptyInvoices = await prisma.feeInvoice.count({
    where: { academicYear: 2026, term: 'TERM_1', totalAmount: 0 }
  });
  console.log(`Total invoices needing update: ${emptyInvoices}`);

  const sampleInvoice = await prisma.feeInvoice.findFirst({
    where: { academicYear: 2026, term: 'TERM_1', totalAmount: 0 },
    include: { learner: true }
  });

  if (sampleInvoice) {
    console.log('\n--- SAMPLE INVOICE ---');
    console.log(`Invoice: ${sampleInvoice.invoiceNumber}`);
    console.log(`Student: ${sampleInvoice.learner.firstName} ${sampleInvoice.learner.lastName}`);
    console.log(`Grade: ${sampleInvoice.learner.grade}`);
    console.log(`Transport Student: ${sampleInvoice.learner.isTransportStudent}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
