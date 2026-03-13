
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tests = await prisma.summativeTest.findMany({
        take: 5,
        select: { term: true, grade: true }
    });
    console.log('Sample Tests:', JSON.stringify(tests, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
