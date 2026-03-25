import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Fixing Class Enrollments...');

    const learners = await prisma.learner.findMany({
        where: { status: 'ACTIVE' }
    });

    console.log(`Found ${learners.length} active learners.`);

    let enrolledCount = 0;
    let skippedCount = 0;

    for (const learner of learners) {
        // Exact match for stream, active class
        const match = await prisma.class.findFirst({
            where: {
                branch: {
                    schoolId: learner.schoolId
                },
                grade: learner.grade,
                stream: learner.stream, // null matches null
                active: true
            },
            orderBy: { academicYear: 'desc' } // prefer latest year
        });

        if (match) {
            try {
                await prisma.classEnrollment.upsert({
                    where: {
                        classId_learnerId: {
                            classId: match.id,
                            learnerId: learner.id
                        }
                    },
                    update: {
                        active: true
                    },
                    create: {
                        classId: match.id,
                        learnerId: learner.id,
                        active: true
                    }
                });
                console.log(`✅ Enrolled ${learner.firstName} in ${match.name} (${match.grade} ${match.stream || ''})`);
                enrolledCount++;
            } catch (e) {
                console.error(`❌ Failed to enroll ${learner.firstName}:`, e);
            }
        } else {
            console.warn(`⚠️  No matching class found for learner ${learner.firstName} (Grade: ${learner.grade}, Stream: ${learner.stream})`);
            skippedCount++;
        }
    }

    console.log(`\nStatistics:`);
    console.log(`- Enrolled: ${enrolledCount}`);
    console.log(`- Skipped: ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
