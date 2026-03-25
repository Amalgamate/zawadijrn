import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listAreas() {
    const areas = await prisma.learningArea.findMany({
        orderBy: { gradeLevel: 'asc' }
    });

    const grouped: { [key: string]: string[] } = {};
    areas.forEach(area => {
        const level = area.gradeLevel || 'Unknown';
        if (!grouped[level]) grouped[level] = [];
        grouped[level].push(area.name);
    });

    console.log('--- Database Learning Areas ---');
    console.log(JSON.stringify(grouped, null, 2));
    process.exit(0);
}

listAreas();
