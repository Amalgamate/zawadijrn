
import { PrismaClient, Grade } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gradesToCheck: Grade[] = [
    Grade.CRECHE, 
    Grade.PLAYGROUP, 
    Grade.RECEPTION, 
    Grade.TRANSITION
  ];
  
  console.log('--- Class Counts by Grade ---');
  for (const grade of gradesToCheck) {
    const count = await prisma.class.count({
      where: { grade: grade }
    });
    console.log(`${grade}: ${count}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
