import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminPhone() {
    const email = 'admin@zawadijunioracademy.co.ke';
    const phone = '0713612141';

    try {
        console.log(`[UPDATE] Updating phone for ${email}...`);

        const user = await prisma.user.update({
            where: { email },
            data: { phone }
        });

        console.log(`✅ Successfully updated phone for ${user.email} to ${user.phone}`);
    } catch (error: any) {
        if (error.code === 'P2025') {
            console.error(`❌ User with email ${email} not found.`);
        } else {
            console.error('❌ Error updating admin phone:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminPhone();
