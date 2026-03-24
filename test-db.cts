const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jpngcprtuqfrjjqgoyvq:gtICRvWBoOQb95a5@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function main() {
  try {
    const count = await prisma.learner.count();
    console.log("TOTAL LEARNERS IN PRODUCTION DB:", count);
    
    if (count > 0) {
        const learners = await prisma.learner.findMany({ take: 3 });
        console.log("Sample:", learners.map(l => l.firstName + ' ' + l.lastName));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
