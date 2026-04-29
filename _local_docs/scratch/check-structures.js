
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const structures = await prisma.feeStructure.findMany({
    where: { academicYear: 2026, term: 'TERM_1', archived: false },
    select: { id: true, name: true, grade: true }
  });
  console.log(JSON.stringify(structures, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
