import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  const enrollmentCount = await prisma.classEnrollment.count({ where: { archived: false } });
  const learnersWithResults = await prisma.learner.count({
    where: {
      OR: [
        { summativeResults: { some: { archived: false } } },
        { formativeAssessments: { some: { archived: false } } }
      ]
    }
  });
  
  const learnersWithResultsAndEnrollment = await prisma.learner.count({
    where: {
      enrollments: { some: { archived: false } },
      OR: [
        { summativeResults: { some: { archived: false } } },
        { formativeAssessments: { some: { archived: false } } }
      ]
    }
  });

  console.log('--- DB RELATIONSHIP Check ---');
  console.log('Class Enrollments:', enrollmentCount);
  console.log('Learners with Results:', learnersWithResults);
  console.log('Learners with Results AND Enrolled:', learnersWithResultsAndEnrollment);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
