import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.learningArea.count();
        const areas = await prisma.learningArea.findMany({
            select: {
                name: true,
                gradeLevel: true
            },
            orderBy: {
                gradeLevel: 'asc'
            }
        });

        console.log(`TOTAL_COUNT:${count}`);
        console.log('--- List of Learning Areas ---');
        areas.forEach(a => {
            console.log(`[${a.gradeLevel}] ${a.name}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
