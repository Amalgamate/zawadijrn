import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inspecting LearningArea gradeLevel values...');

  const uniqueGrades = await prisma.learningArea.findMany({
    select: {
      gradeLevel: true
    },
    distinct: ['gradeLevel']
  });

  console.log('Unique grade levels found:', uniqueGrades.map(g => g.gradeLevel));

  const crecheAreas = await prisma.learningArea.findMany({
    where: {
      gradeLevel: {
        contains: 'CRECHE',
        mode: 'insensitive'
      }
    }
  });
  console.log(`Found ${crecheAreas.length} areas containing "CRECHE" (case-insensitive).`);
  if (crecheAreas.length > 0) {
    console.log('Sample:', crecheAreas[0]);
  }
}

main()
  .catch((e) => {
    console.error('Inspection failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
