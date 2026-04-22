import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanAndSeed() {
  await prisma.feeStructureItem.deleteMany({});
  await prisma.feeStructure.deleteMany({});
  console.log('Deleted existing fee structures and items.');
  await prisma.$disconnect();
}
cleanAndSeed();
