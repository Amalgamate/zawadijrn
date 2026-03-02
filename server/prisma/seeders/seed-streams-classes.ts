import prisma from '../../src/config/database';

/**
 * Backfill default streams and classes for all schools that don't have them
 * Run: npx ts-node prisma/seeders/seed-streams-classes.ts
 */

const GRADES = [
  'CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP',
  'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3',
  'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7',
  'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
];

const GRADE_DISPLAY_NAMES: Record<string, string> = {
  'CRECHE': 'Creche',
  'RECEPTION': 'Reception',
  'TRANSITION': 'Transition',
  'PLAYGROUP': 'Playgroup',
  'PP1': 'PP1',
  'PP2': 'PP2',
  'GRADE_1': 'Grade 1',
  'GRADE_2': 'Grade 2',
  'GRADE_3': 'Grade 3',
  'GRADE_4': 'Grade 4',
  'GRADE_5': 'Grade 5',
  'GRADE_6': 'Grade 6',
  'GRADE_7': 'Grade 7',
  'GRADE_8': 'Grade 8',
  'GRADE_9': 'Grade 9',
  'GRADE_10': 'Grade 10',
  'GRADE_11': 'Grade 11',
  'GRADE_12': 'Grade 12'
};

const STREAM_NAMES = ['A', 'B', 'C', 'D'];

async function seedStreamsAndClasses() {
  console.log('🌱 Seeding default streams and classes for all schools...');

  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      include: { branches: true }
    });
    console.log(`Found ${schools.length} schools`);

    for (const school of schools) {
      console.log(`\n🏫 Processing school: ${school.name}`);

      // Check if streams already exist
      const existingStreams = await prisma.streamConfig.count({
        where: { schoolId: school.id }
      });

      if (existingStreams > 0) {
        console.log(`  ✓ Streams already exist (${existingStreams} found), skipping stream creation`);
      } else {
        console.log(`  Creating ${STREAM_NAMES.length} streams...`);
        let streamsCreated = 0;

        for (const streamName of STREAM_NAMES) {
          try {
            await prisma.streamConfig.create({
              data: {
                schoolId: school.id,
                name: streamName,
                active: true
              }
            });
            streamsCreated++;
          } catch (error: any) {
            if (error.code === 'P2002') {
              console.log(`    ⚠️ Stream ${streamName} already exists (skipped)`);
            } else {
              console.error(`    ❌ Error creating stream ${streamName}:`, error.message);
            }
          }
        }

        console.log(`  ✅ Created ${streamsCreated} streams`);
      }

      // Get the default branch or first branch
      const branch = school.branches && school.branches.length > 0
        ? school.branches[0]
        : await prisma.branch.findFirst({
            where: { schoolId: school.id }
          });

      if (!branch) {
        console.log(`  ⚠️ No branch found for school, skipping class creation`);
        continue;
      }

      // Check if classes already exist
      const existingClasses = await prisma.class.count({
        where: { branchId: branch.id }
      });

      const expectedClasses = GRADES.length * STREAM_NAMES.length;

      if (existingClasses >= expectedClasses) {
        console.log(`  ✓ Classes already exist (${existingClasses} found), skipping class creation`);
      } else if (existingClasses > 0) {
        console.log(`  ⚠️ Found ${existingClasses} classes but expected ${expectedClasses}. Deleting old classes and recreating...`);
        await prisma.class.deleteMany({ where: { branchId: branch.id } });
        console.log(`  Deleted old classes, now creating ${expectedClasses} new classes...`);
        let classesCreated = 0;
        const currentYear = new Date().getFullYear();

        for (const grade of GRADES) {
          for (const stream of STREAM_NAMES) {
            try {
              await prisma.class.create({
                data: {
                  branchId: branch.id,
                  name: `${GRADE_DISPLAY_NAMES[grade]} - ${stream}`,
                  grade: grade as any,
                  stream: stream,
                  academicYear: currentYear,
                  term: 'TERM_1' as any,
                  capacity: 40,
                  active: true
                }
              });
              classesCreated++;
            } catch (error: any) {
              if (error.code === 'P2002') {
                // Unique constraint violation - likely duplicate
                console.log(
                  `    ⚠️ ${GRADE_DISPLAY_NAMES[grade]} - ${stream} already exists (skipped)`
                );
              } else {
                console.error(
                  `    ❌ Error creating ${GRADE_DISPLAY_NAMES[grade]} - ${stream}:`,
                  error.message
                );
              }
            }
          }
        }

        console.log(`  ✅ Created ${classesCreated} classes`);
      } else {
        console.log(`  Creating classes for all grades and streams...`);
        let classesCreated = 0;
        const currentYear = new Date().getFullYear();

        for (const grade of GRADES) {
          for (const stream of STREAM_NAMES) {
            try {
              await prisma.class.create({
                data: {
                  branchId: branch.id,
                  name: `${GRADE_DISPLAY_NAMES[grade]} - ${stream}`,
                  grade: grade as any,
                  stream: stream,
                  academicYear: currentYear,
                  term: 'TERM_1' as any,
                  capacity: 40,
                  active: true
                }
              });
              classesCreated++;
            } catch (error: any) {
              if (error.code === 'P2002') {
                console.log(
                  `    ⚠️ ${GRADE_DISPLAY_NAMES[grade]} - ${stream} already exists (skipped)`
                );
              } else {
                console.error(
                  `    ❌ Error creating ${GRADE_DISPLAY_NAMES[grade]} - ${stream}:`,
                  error.message
                );
              }
            }
          }
        }

        console.log(`  ✅ Created ${classesCreated} classes`);
      }
    }

    console.log('\n✅ Streams and classes seeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedStreamsAndClasses();
