import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  console.log('--- VERIFYING DASHBOARD LOGIC ---');
  
  const assessedClassCount = await prisma.class.count({
    where: {
        archived: false,
        enrollments: {
            some: {
                learner: {
                    OR: [
                        { summativeResults: { some: { archived: false } } },
                        { formativeAssessments: { some: { archived: false } } }
                    ]
                }
            }
        }
    }
  });

  const latestSummative = await prisma.summativeResult.findMany({
    orderBy: { createdAt: 'desc' }, take: 5,
    select: { marksObtained: true, test: { select: { title: true, learningArea: true } }, learner: { select: { firstName: true, lastName: true } }, createdAt: true }
  });

  console.log('Assessed Class Count:', assessedClassCount);
  console.log('Latest Summative Results Count:', latestSummative.length);
  if (latestSummative.length > 0) {
      console.log('Sample Result:', latestSummative[0].test.title, 'for', latestSummative[0].learner.firstName);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
