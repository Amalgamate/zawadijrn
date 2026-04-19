const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransportUpdate() {
  const learner = await prisma.learner.findUnique({
    where: { admissionNumber: '1307' },
    select: { id: true, firstName: true, lastName: true, isTransportStudent: true }
  });

  if (!learner) {
    console.log("Learner not found");
    return;
  }

  console.log("Learner:", learner);

  const invoice = await prisma.feeInvoice.findFirst({
    where: { learnerId: learner.id },
    orderBy: { createdAt: 'desc' }
  });

  if (!invoice) {
    console.log("Invoice not found");
  } else {
    console.log("Latest Invoice Transport Stats:", {
      transportBilled: invoice.transportBilled,
      transportPaid: invoice.transportPaid,
      transportBalance: invoice.transportBalance,
    });
  }

  await prisma.$disconnect();
}

checkTransportUpdate();
