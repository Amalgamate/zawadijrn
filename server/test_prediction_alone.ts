
// Create a separate standalone ts execution script without conflicts
import { aiAssistantService } from './src/services/ai-assistant.service';
import prisma from './src/config/database';

async function testPrediction() {
    try {
        const learner = await prisma.learner.findFirst({
            where: { admissionNumber: '1441' },
            select: { id: true, firstName: true }
        });

        if (learner) {
            console.log('Testing prediction for:', learner.firstName);
            const prediction = await aiAssistantService.generatePathwayPrediction(
                learner.id,
                'TERM_1',
                2026
            );
            console.log('Prediction Output:', JSON.stringify(prediction, null, 2));
        }

    } catch (error) {
        console.error('Error generating prediction:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPrediction();
