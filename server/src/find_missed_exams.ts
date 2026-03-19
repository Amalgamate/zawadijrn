import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  console.log('--- FINDING CURRENT TEST ---');
  
  const latestTests = await prisma.summativeTest.findMany({
    where: { archived: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, grade: true, learningArea: true, term: true, academicYear: true }
  });

  console.log('Latest Tests:', JSON.stringify(latestTests, null, 2));
  
  if (latestTests.length > 0) {
      const currentTest = latestTests[0];
      const studentsInGrade = await prisma.learner.count({
          where: { grade: currentTest.grade, archived: false, status: 'ACTIVE' }
      });
      const resultsForTest = await prisma.summativeResult.count({
          where: { testId: currentTest.id, archived: false }
      });
      
      console.log(`Current Test: ${currentTest.title} (${currentTest.grade})`);
      console.log(`Total Students in Grade: ${studentsInGrade}`);
      console.log(`Results Found: ${resultsForTest}`);
      console.log(`Missed: ${Math.max(0, studentsInGrade - resultsForTest)}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
