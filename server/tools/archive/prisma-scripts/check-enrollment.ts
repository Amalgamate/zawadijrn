import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Class Enrollments...');

    const enrollmentCount = await prisma.classEnrollment.count();
    console.log(`Total Enrollments: ${enrollmentCount}`);

    const classCount = await prisma.class.count();
    console.log(`Total Classes: ${classCount}`);

    const learnerCount = await prisma.learner.count();
    console.log(`Total Learners: ${learnerCount}`);

    if (enrollmentCount === 0 && learnerCount > 0 && classCount > 0) {
        console.log('⚠️  Mismatch: Learners and Classes exist but no Enrollments!');

        // Auto-fix?
        // I'll leave that for the next step.
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
