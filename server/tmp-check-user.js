
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@zawadijunioracademy.co.ke';
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            schoolId: true
        }
    });

    console.log('User found:', JSON.stringify(user, null, 2));

    if (!user) {
        console.log('ERROR: User not found in DB');
    } else if (user.status !== 'ACTIVE') {
        console.log('ERROR: User status is', user.status);
    } else if (!user.phone) {
        console.log('ERROR: User has no phone number');
    } else {
        console.log('User is valid for OTP');
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
