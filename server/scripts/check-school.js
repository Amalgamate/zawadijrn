const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  console.log('School Record:', school);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
