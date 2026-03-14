
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- All Learner Counts by Grade ---');
  
  const counts = await prisma.learner.groupBy({
    by: ['grade'],
    _count: {
      id: true
    }
  });
  
  if (counts.length === 0) {
    console.log('No learners found in the system.');
  } else {
    counts.forEach(item => {
      console.log(`${item.grade}: ${item._count.id}`);
    });
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
