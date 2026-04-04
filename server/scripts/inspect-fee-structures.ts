import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, udt_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'fee_structures';
    `);
    console.log(JSON.stringify(cols, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
