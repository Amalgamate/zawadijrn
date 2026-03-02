/**
 * Cleanup Script - Delete All Learning Areas
 * 
 * Usage: npx ts-node prisma/cleanup-learning-areas.ts
 */

import prisma from '../src/config/database';

async function cleanupLearningAreas() {
  try {
    console.log('🗑️  Starting learning areas cleanup...\n');

    const deleted = await prisma.learningArea.deleteMany({});

    console.log(`✅ Successfully deleted ${deleted.count} learning areas`);
    console.log('\n💡 Next steps:');
    console.log('   1. npm run seed:classes  (if not already seeded)');
    console.log('   2. npm run seed:learning-areas');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupLearningAreas();
