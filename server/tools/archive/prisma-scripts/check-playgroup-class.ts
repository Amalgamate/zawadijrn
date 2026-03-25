
import { PrismaClient, Grade } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Playgroup Class Details ---');
  const classes = await prisma.class.findMany({
    where: { grade: Grade.PLAYGROUP },
    include: {
      teacher: true
    }
  });
  
  if (classes.length === 0) {
    console.log('No Playgroup classes found.');
  } else {
    classes.forEach(c => {
      console.log(`Class: ${c.name}, Grade: ${c.grade}, Stream: ${c.stream}, Teacher: ${c.teacher?.firstName} ${c.teacher?.lastName || ''}`);
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
