import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  const latestTest = await prisma.summativeTest.findFirst({
      where: { archived: false, academicYear: 2026, term: 'TERM_1' },
      orderBy: { createdAt: 'desc' },
      select: { testType: true, term: true, academicYear: true }
  });

  if (latestTest && latestTest.testType) {
      const testsInSeries = await prisma.summativeTest.findMany({
          where: { testType: latestTest.testType, term: latestTest.term, academicYear: latestTest.academicYear, archived: false },
          select: { id: true, grade: true }
      });

      const testIds = testsInSeries.map(t => t.id);
      const grades = [...new Set(testsInSeries.map(t => t.grade))];

      const studentsAffected = await prisma.learner.findMany({
          where: { status: 'ACTIVE', archived: false, grade: { in: grades as any } },
          select: { id: true }
      });

      const studentsWithSomeResults = await prisma.summativeResult.findMany({
          where: { testId: { in: testIds }, archived: false },
          select: { learnerId: true },
          distinct: ['learnerId']
      });

      const resultsSet = new Set(studentsWithSomeResults.map(r => r.learnerId));
      const totalUnAssessed = studentsAffected.filter(s => !resultsSet.has(s.id)).length;

      console.log('--- VERIFYING UN-ASSESSED LOGIC ---');
      console.log('Current Series:', latestTest.testType);
      console.log('Total Students in affected Grades:', studentsAffected.length);
      console.log('Students with at least ONE result:', studentsWithSomeResults.length);
      console.log('Total Un-Assessed Students:', totalUnAssessed);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
