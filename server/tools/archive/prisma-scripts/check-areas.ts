import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.learningArea.count();
    console.log(`TOTAL_COUNT:${count}`);

    const all = await prisma.learningArea.findMany();
    console.log(JSON.stringify(all, null, 2));
}

main();
