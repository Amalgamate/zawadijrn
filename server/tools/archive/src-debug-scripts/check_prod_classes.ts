import { PrismaClient } from '@prisma/client';

// Use production URL from .env.production
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  }
});

async function main() {
  const classCount = await prisma.class.count({ where: { archived: false } });
  const allClassCount = await prisma.class.count();
  
  console.log('--- PRODUCTION DB Check ---');
  console.log('Non-archived Class Count:', classCount);
  console.log('Total Class Count:', allClassCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
