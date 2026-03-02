require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

console.log('Testing database connection...');
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!');
    console.log('Query result:', result);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

setTimeout(() => {
  console.error('❌ Connection timeout');
  process.exit(2);
}, 15000);

test();
