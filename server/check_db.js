const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            schoolId: true,
        },
    });
    console.log('Total Users:', users.length);
    console.log('Users Data:', JSON.stringify(users, null, 2));
    await prisma.$disconnect();
}

checkUsers();
