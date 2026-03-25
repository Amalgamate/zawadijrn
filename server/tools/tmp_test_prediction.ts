
import { aiAssistantService } from './src/services/ai-assistant.service';
import prisma from './src/config/database';

async function test() {
    try {
        const learner = await prisma.learner.findFirst({
            where: { admissionNumber: '1441' } // AFNAN
        });

        if (!learner) {
            console.log('Learner not found');
            return;
        }

        console.log(`Testing for learner: ${learner.firstName} ${learner.lastName} (ID: ${learner.id})`);

        const prediction = await aiAssistantService.generatePathwayPrediction(
            learner.id,
            'TERM_1',
            2026
        );

        console.log('Prediction Result:', JSON.stringify(prediction, null, 2));

        // Check results directly
        const results = await prisma.summativeResult.findMany({
            where: {
                learnerId: learner.id,
                test: {
                    academicYear: 2026,
                    term: 'TERM_1'
                }
            },
            include: { test: true }
        });

        console.log(`Found ${results.length} summative results for TERM_1 2026`);
        results.forEach(r => {
            console.log(`- ${r.test.learningArea}: ${r.score}%`);
        });

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
