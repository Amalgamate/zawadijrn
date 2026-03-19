import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classCount = await prisma.class.count({ where: { archived: false } });
  const allClassCount = await prisma.class.count();
  const classes = await prisma.class.findMany({ select: { id: true, name: true, grade: true } });
  
  console.log('--- DB Check ---');
  console.log('Non-archived Class Count:', classCount);
  console.log('Total Class Count (including archived):', allClassCount);
  console.log('Classes:', JSON.stringify(classes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
