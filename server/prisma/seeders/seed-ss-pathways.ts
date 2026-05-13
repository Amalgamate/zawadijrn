import { PrismaClient } from '@prisma/client';
import { seedSeniorPathways as canonicalSeedSeniorPathways } from '../../src/services/ss-pathways.seed';

export async function seedSeniorPathways(prisma: PrismaClient) {
  console.log('\n🧭 Seeding Senior Secondary Pathways & Categories (canonical source)...');
  await canonicalSeedSeniorPathways(prisma);
  console.log('   ✅ Pathways and categories seeded.');
}

