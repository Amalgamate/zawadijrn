
import { PrismaClient, Grade } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gradesToCheck: Grade[] = [
    Grade.CRECHE, 
    Grade.PLAYGROUP, 
    Grade.RECEPTION, 
    Grade.TRANSITION
  ];
  
  console.log('--- Learner Counts by Grade ---');
  for (const grade of gradesToCheck) {
    const count = await prisma.learner.count({
      where: { grade: grade }
    });
    console.log(`${grade}: ${count}`);
  }
  
  const totalBelowPP1 = await prisma.learner.count({
    where: {
      grade: {
        in: gradesToCheck
      }
    }
  });
  console.log('---------------------------');
  console.log(`Total Below PP1: ${totalBelowPP1}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
