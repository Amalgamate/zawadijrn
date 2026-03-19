import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  const formativeCount = await prisma.formativeAssessment.count({ where: { archived: false } });
  const summativeCount = await prisma.summativeTest.count({ where: { archived: false } });
  const resultCount = await prisma.summativeResult.count({ where: { archived: false } });
  
  console.log('--- PRODUCTION ASSESSMENT Check ---');
  console.log('Formative Assessments:', formativeCount);
  console.log('Summative Tests:', summativeCount);
  console.log('Summative Results:', resultCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
