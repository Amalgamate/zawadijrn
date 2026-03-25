import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  console.log('--- VERIFYING REFINED DASHBOARD LOGIC ---');
  
  const assessedGradesStreams = await prisma.learner.findMany({
    where: {
        archived: false,
        OR: [
            { summativeResults: { some: { archived: false } } },
            { formativeAssessments: { some: { archived: false } } }
        ]
    },
    select: { grade: true, stream: true },
    distinct: ['grade', 'stream']
  });

  const assessedClassCount = assessedGradesStreams.length > 0
    ? await prisma.class.count({
        where: {
            archived: false,
            OR: assessedGradesStreams.map(gs => ({
                grade: gs.grade,
                stream: gs.stream
            }))
        }
    })
    : 0;

  console.log('Assessed Grades/Streams Found:', assessedGradesStreams.length);
  console.log('Assessed Class Count:', assessedClassCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
