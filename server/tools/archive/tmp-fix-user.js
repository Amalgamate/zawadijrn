
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@zawadijunioracademy.co.ke';
    const phone = '+254712345678'; // Example phone number

    const updatedUser = await prisma.user.update({
        where: { email },
        data: { phone }
    });

    console.log('User updated:', JSON.stringify(updatedUser, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
