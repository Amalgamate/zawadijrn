import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const school = await prisma.school.findFirst();
    console.log('School Record:', JSON.stringify(school, null, 2));

    const userCount = await prisma.user.count({ where: { archived: false } });
    console.log('Total Unarchived Users:', userCount);

    const learnerCount = await prisma.learner.count({ where: { status: 'ACTIVE' } });
    console.log('Total Active Learners:', learnerCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
