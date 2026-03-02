import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const whereClause: any = { archived: false };

    // This is the EXACT query in getAllLearners
    const learners = await prisma.learner.findMany({
        where: whereClause,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            admissionNumber: true,
            grade: true,
            stream: true,
            dateOfBirth: true,
            gender: true,
            parentId: true,
            status: true,
            primaryContactPhone: true,
            primaryContactName: true,
            primaryContactType: true,
            primaryContactEmail: true,
            guardianPhone: true,
            guardianName: true,
            parent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            },
        },
        orderBy: [
            { createdAt: 'desc' },
            { grade: 'asc' },
            { stream: 'asc' },
            { lastName: 'asc' },
            { firstName: 'asc' },
        ],
        skip: 0,
        take: 50,
    });

    console.log(`Found ${learners.length} learners for the exact query.`);
    if (learners.length > 0) {
        console.log('First learner:', JSON.stringify(learners[0], null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
