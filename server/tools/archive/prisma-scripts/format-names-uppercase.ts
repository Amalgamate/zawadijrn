/**
 * Script to format all existing names in the database to UPPERCASE
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting format-names-uppercase script...');

    // 1. Format Users
    console.log('Fetching users...');
    const users = await prisma.user.findMany();
    let usersUpdated = 0;

    for (const user of users) {
        let needsUpdate = false;
        const data: any = {};

        if (user.firstName && user.firstName !== user.firstName.toUpperCase()) {
            data.firstName = user.firstName.toUpperCase();
            needsUpdate = true;
        }
        if (user.lastName && user.lastName !== user.lastName.toUpperCase()) {
            data.lastName = user.lastName.toUpperCase();
            needsUpdate = true;
        }
        if (user.middleName && user.middleName !== user.middleName.toUpperCase()) {
            data.middleName = user.middleName.toUpperCase();
            needsUpdate = true;
        }

        if (needsUpdate) {
            await prisma.user.update({
                where: { id: user.id },
                data
            });
            usersUpdated++;
        }
    }
    console.log(`✅ Updated ${usersUpdated}/${users.length} Users.`);

    // 2. Format Learners
    console.log('Fetching learners...');
    const learners = await prisma.learner.findMany();
    let learnersUpdated = 0;

    for (const learner of learners) {
        let needsUpdate = false;
        const data: any = {};

        const nameFields = [
            'firstName', 'lastName', 'middleName',
            'guardianName', 'fatherName', 'motherName', 'primaryContactName'
        ];

        for (const field of nameFields) {
            const val = (learner as any)[field];
            if (val && typeof val === 'string' && val !== val.toUpperCase()) {
                data[field] = val.toUpperCase();
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await prisma.learner.update({
                where: { id: learner.id },
                data
            });
            learnersUpdated++;
        }
    }
    console.log(`✅ Updated ${learnersUpdated}/${learners.length} Learners.`);

    console.log('🎉 Formatting complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
