import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const invoices = await prisma.feeInvoice.findMany({
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            grade: true,
            stream: true,
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        feeStructure: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    console.log('OK - records found:', invoices.length);
  } catch(e: any) {
    console.error('PRISMA ERROR:', e.message);
    console.error('CODE:', e.code);
  } finally {
    await prisma.$disconnect();
  }
}
main();
