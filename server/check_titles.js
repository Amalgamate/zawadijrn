require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const sample = await p.summativeTest.findMany({
    where: { status: 'PUBLISHED', archived: false },
    select: { title: true, testType: true, term: true, academicYear: true, grade: true, learningArea: true },
    take: 6,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Sample test titles:');
  sample.forEach(t => console.log(`  title: "${t.title}" | type: ${t.testType} | term: ${t.term}`));
}

main().catch(e => console.error(e.message)).finally(() => p.$disconnect());
