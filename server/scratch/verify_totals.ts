import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTotals() {
  try {
    const where = {}; // Add filters if needed
    
    const [debts, credits, aggregate] = await Promise.all([
      prisma.feeInvoice.aggregate({
        where: { ...where, balance: { gt: 0 } },
        _sum: { balance: true }
      }),
      prisma.feeInvoice.aggregate({
        where: { ...where, balance: { lt: 0 } },
        _sum: { balance: true }
      }),
      prisma.feeInvoice.aggregate({
        where,
        _sum: { balance: true }
      })
    ]);

    console.log('Total Debt (Positive Balances):', Number(debts._sum.balance || 0));
    console.log('Total Overpaid (Negative Balances):', Math.abs(Number(credits._sum.balance || 0)));
    console.log('Net Balance (Original Sum):', Number(aggregate._sum.balance || 0));
    console.log('Reconciliation check (Debt - Overpaid):', Number(debts._sum.balance || 0) - Math.abs(Number(credits._sum.balance || 0)));

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTotals();
