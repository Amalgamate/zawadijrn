import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'admin@zawadijunioracademy.co.ke',
        password: '$2a$10$P.gWdFVLw7H7bQZJ8H5y6OQhUx8XJ9k2nLv0n5Z3w5K9mM2L0q5Be',
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Role: ${user.role}`);
  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
