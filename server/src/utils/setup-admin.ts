import bcrypt from 'bcrypt';
import prisma from '../config/database';

/**
 * Ensures a SuperAdmin user exists in the database with the provided credentials.
 * If the user exists, it updates the password to match.
 */
export async function ensureSuperAdmin() {
    const email = 'admin@zawadijunioracademy.co.ke';
    const password = 'Admin@123!';

    try {
        console.log(`[SETUP] Ensuring SuperAdmin exists: ${email}...`);

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                status: 'ACTIVE',
                role: 'SUPER_ADMIN',
            },
            create: {
                email,
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
            },
        });

        console.log(`✅ SuperAdmin account ready: ${user.email} (ID: ${user.id})`);
    } catch (error: any) {
        console.error('❌ Error during SuperAdmin setup:', error.message);
    }
}
