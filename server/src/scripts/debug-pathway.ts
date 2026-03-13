
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        // 1. Check a specific Grade 7 learner from the screenshot
        const learner = await prisma.learner.findFirst({
            where: { admissionNumber: '1441' }, // AFNAN
            select: { id: true, firstName: true, lastName: true }
        });
        console.log('Learner:', learner);

        if (learner) {
            // 2. Check their results
            const results = await prisma.summativeResult.findMany({
                where: { learnerId: learner.id },
                include: { test: true }
            });
            console.log(`Results for ${learner.firstName}:`, results.length);
            if (results.length > 0) {
                // Unique learning areas for this learner
                const areas = new Set(results.map(r => r.test.learningArea));
                console.log('\n=== LEARNING AREAS REPORTED ===');
                console.log(Array.from(areas).join('\n'));
                console.log('===============================\n');
            } else {
                console.log('No results found for this learner');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
