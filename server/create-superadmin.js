require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating SuperAdmin user...\n');

    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@template.test';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeNow123!';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ User with email "${email}" already exists`);
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create superadmin
    const superadmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
      },
    });

    console.log('✅ SuperAdmin user created successfully!\n');
    console.log('📝 User Details:');
    console.log(`   Email: ${superadmin.email}`);
    console.log(`   Role: ${superadmin.role}`);
    console.log(`   ID: ${superadmin.id}`);
    console.log(`\n🔑 Login Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  IMPORTANT: Change this password after first login!\n`);

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Error creating SuperAdmin:', err.message);
    process.exit(1);
  }
}

createSuperAdmin();
