import bcrypt from 'bcrypt';
import prisma from '../config/database';

/**
 * Ensures initial users exist in the database for testing and administration.
 */
export async function ensureSuperAdmin() {
    const demoPassword = 'Demo@123!';
    const hashedPassword = await bcrypt.hash(demoPassword, 12);

    const usersToCreate = [
        {
            email: 'admin@zawadijunioracademy.co.ke',
            password: 'Admin@123!', // Keep original superadmin password
            firstName: 'System',
            lastName: 'Administrator',
            role: 'SUPER_ADMIN' as const,
            phone: '0713612141'
        },
        {
            email: 'teacher@demo.com',
            password: demoPassword,
            firstName: 'Demo',
            lastName: 'Teacher',
            role: 'TEACHER' as const,
            phone: '0700000001'
        },
        {
            email: 'accountant@demo.com',
            password: demoPassword,
            firstName: 'Demo',
            lastName: 'Accountant',
            role: 'ACCOUNTANT' as const,
            phone: '0700000002'
        },
        {
            email: 'parent@demo.com',
            password: demoPassword,
            firstName: 'Demo',
            lastName: 'Parent',
            role: 'PARENT' as const,
            phone: '0700000003'
        }
    ];

    try {
        console.log('[SETUP] Checking/Creating initial users...');

        for (const userData of usersToCreate) {
            const finalHashedPassword = userData.email === 'admin@zawadijunioracademy.co.ke' 
                ? await bcrypt.hash(userData.password, 12) 
                : hashedPassword;

            await prisma.user.upsert({
                where: { email: userData.email },
                update: {
                    status: 'ACTIVE',
                    role: userData.role,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                },
                create: {
                    email: userData.email,
                    password: finalHashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    status: 'ACTIVE',
                    phone: userData.phone
                },
            });
            console.log(`✅ User ready: ${userData.email} (${userData.role})`);
        }
    } catch (error: any) {
        console.error('❌ Error during user setup:', error.message);
    }
}
