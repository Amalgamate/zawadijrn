import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  const tests = await prisma.summativeTest.groupBy({
    by: ['testType'],
    where: { archived: false },
    _count: true
  });
  console.log('Test Types:', JSON.stringify(tests, null, 2));

  const latestTest = await prisma.summativeTest.findFirst({
    where: { archived: false },
    orderBy: { createdAt: 'desc' }
  });
  
  if (latestTest) {
    console.log('Latest Test Type:', latestTest.testType);
    
    // Count missed for all tests of the same type in the current term
    const testsOfType = await prisma.summativeTest.findMany({
      where: { testType: latestTest.testType, term: latestTest.term, academicYear: latestTest.academicYear, archived: false }
    });
    
    let totalMissed = 0;
    for (const test of testsOfType) {
      const studentsInGrade = await prisma.learner.count({
        where: { grade: test.grade, archived: false, status: 'ACTIVE' }
      });
      const resultsForTest = await prisma.summativeResult.count({
        where: { testId: test.id, archived: false }
      });
      totalMissed += Math.max(0, studentsInGrade - resultsForTest);
    }
    
    console.log(`Total Missed for ${latestTest.testType} series: ${totalMissed}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
