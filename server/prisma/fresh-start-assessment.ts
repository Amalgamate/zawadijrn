import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting Database Refresh (Assessment Module)...');

    try {
        // Order matters to respect foreign key constraints

        console.log('🗑️ Deleting Summative Result History...');
        await prisma.summativeResultHistory.deleteMany({});

        console.log('🗑️ Deleting Summative Results...');
        await prisma.summativeResult.deleteMany({});

        console.log('🗑️ Deleting Summative Tests...');
        await prisma.summativeTest.deleteMany({});

        console.log('🗑️ Deleting Formative Assessments...');
        await prisma.formativeAssessment.deleteMany({});

        console.log('🗑️ Deleting Assessment SMS Audits...');
        await prisma.assessmentSmsAudit.deleteMany({});

        console.log('🗑️ Deleting Grading Ranges...');
        await prisma.gradingRange.deleteMany({});

        console.log('🗑️ Deleting Grading Systems...');
        await prisma.gradingSystem.deleteMany({});

        console.log('🗑️ Deleting Scale Groups...');
        await prisma.scaleGroup.deleteMany({});

        console.log('✅ Fresh start complete! All tests and scales have been removed.');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
