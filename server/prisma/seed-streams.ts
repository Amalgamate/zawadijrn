/**
 * Seed Streams Script
 * Seeds streams A-D for all active schools
 * 
 * Usage: 
 *   npx ts-node prisma/seed-streams.ts
 * Or:
 *   npm run seed:streams
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStreams() {
  console.log('🌱 Starting stream seed...\n');

  try {
    // Get all active schools
    const schools = await prisma.school.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true
      }
    });

    if (schools.length === 0) {
      console.log('⚠️  No active schools found in database.');
      console.log('   Please create a school first before seeding streams.\n');
      return;
    }

    console.log(`📚 Found ${schools.length} active school(s)\n`);

    // Define streams to create
    const streamNames = ['A', 'B', 'C', 'D'];
    let totalCreated = 0;
    let totalSkipped = 0;

    // Create streams for each school
    for (const school of schools) {
      console.log(`🏫 Processing: ${school.name}`);
      console.log(`   School ID: ${school.id}`);
      
      for (const streamName of streamNames) {
        try {
          // Check if stream already exists (case-insensitive)
          const existingStream = await prisma.streamConfig.findFirst({
            where: {
              schoolId: school.id,
              name: {
                equals: streamName,
                mode: 'insensitive'
              }
            }
          });

          if (existingStream) {
            console.log(`   ⏭️  Stream "${streamName}" already exists (ID: ${existingStream.id})`);
            totalSkipped++;
            continue;
          }

          // Create the stream
          const newStream = await prisma.streamConfig.create({
            data: {
              schoolId: school.id,
              name: streamName,
              active: true
            }
          });

          console.log(`   ✅ Created stream "${newStream.name}" (ID: ${newStream.id})`);
          totalCreated++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`   ❌ Error creating stream "${streamName}": ${errorMessage}`);
        }
      }
      
      console.log(''); // Empty line between schools
    }

    // Summary
    console.log('━'.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Schools processed: ${schools.length}`);
    console.log(`   Streams created: ${totalCreated}`);
    console.log(`   Streams skipped (already exist): ${totalSkipped}`);
    console.log('━'.repeat(60));
    console.log('\n✨ Stream seeding completed!\n');

    // Show current state
    console.log('📋 Current Streams by School:');
    console.log('━'.repeat(60));
    
    for (const school of schools) {
      const streams = await prisma.streamConfig.findMany({
        where: { schoolId: school.id },
        orderBy: { name: 'asc' }
      });
      
      console.log(`\n${school.name}:`);
      if (streams.length === 0) {
        console.log('   No streams');
      } else {
        streams.forEach(stream => {
          const status = stream.active ? '🟢' : '⚫';
          console.log(`   ${status} ${stream.name}`);
        });
      }
    }
    console.log('\n' + '━'.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during stream seeding:', error);
    throw error;
  }
}

// Run the seeding function
seedStreams()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
