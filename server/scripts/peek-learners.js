const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const learners = await prisma.learner.findMany({
    take: 5,
    select: { id: true, admissionNumber: true, firstName: true, lastName: true }
  });
  console.log("Sample Learners in DB:");
  console.log(learners);
}

main().catch(console.error).finally(() => prisma.$disconnect());
