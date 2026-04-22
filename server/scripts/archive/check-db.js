const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1"
    }
  }
});

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT DISTINCT "testType" FROM summative_tests`;
    console.log("Distinct test types:", result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();