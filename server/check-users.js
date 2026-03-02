require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`\n📊 Total users in database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Database is empty.');
      console.log('\n✋ You need to seed the database with users.');
      return false;
    }

    console.log('👥 Users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    const superadmin = users.find(u => u.role === 'SUPER_ADMIN');
    console.log(`\n${superadmin ? '✅' : '❌'} SuperAdmin: ${superadmin ? superadmin.email : 'NOT FOUND'}`);
    
    return !!superadmin;
  } catch (err) {
    console.error('❌ Error checking users:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
