
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const areas = await prisma.learningArea.findMany({
        where: { gradeLevel: 'Junior School' },
        select: { name: true }
    });
    console.log('Junior School Areas:', JSON.stringify(areas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
