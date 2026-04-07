import { PrismaClient } from '@prisma/client';
import { seedSeniorPathways } from '../src/services/ss-pathways.seed';

const prisma = new PrismaClient();

async function main() {
  await seedSeniorPathways(prisma);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

