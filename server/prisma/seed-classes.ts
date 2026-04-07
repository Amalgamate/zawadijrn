/**
 * Seed Classes Script
 * Seeds all grades with all streams (A-D) in a given stream for active schools
 * 
 * Usage: 
 *   npx ts-node prisma/seed-classes.ts
 * Or:
 *   npm run seed:classes
 * 
 * This script creates one class for each grade in stream A by default
 * You can modify STREAM_NAME or STREAMS array to create multiple streams
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const STREAMS = ['A']; // Create classes for only Stream A
const ACADEMIC_YEAR = 2025;
const CURRENT_TERM = 'TERM_1';
const CLASS_CAPACITY = 40;

// All available grades in order
const GRADES = [
  'PLAYGROUP',
  'PP1',
  'PP2',
  'GRADE_1',
  'GRADE_2',
  'GRADE_3',
  'GRADE_4',
  'GRADE_5',
  'GRADE_6',
  'GRADE_7',
  'GRADE_8',
  'GRADE_9'
];

// Senior School grades (Grade 10–12)
const SS_GRADES = ['GRADE10', 'GRADE11', 'GRADE12'];

// Grade name mappings for display
const GRADE_DISPLAY_NAMES: Record<string, string> = {
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
  'GRADE_9': 'Grade 9'
};

async function seedClasses() {
  console.log('🌱 Starting classes seed...\n');
  console.log(`📋 Configuration:`);
  console.log(`   Streams: ${STREAMS.join(', ')}`);
  console.log(`   Academic Year: ${ACADEMIC_YEAR}`);
  console.log(`   Term: ${CURRENT_TERM}`);
  console.log(`   Class Capacity: ${CLASS_CAPACITY}`);
  console.log(`   Total Grades: ${GRADES.length}`);
  console.log(`   Classes to Create: ${GRADES.length * STREAMS.length} per branch\n`);
  console.log('━'.repeat(70));

  try {
    // Get all active schools
    const schools = await prisma.school.findMany({
      where: { active: true }
    });

    if (schools.length === 0) {
      console.log('⚠️  No active schools found in database.');
      console.log('   Please create a school first before seeding classes.\n');
      return;
    }

    console.log(`\n📚 Found ${schools.length} active school(s)\n`);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each school
    for (const school of schools) {
      console.log(`\n🏫 School: ${school.name}`);
      console.log(`   School ID: ${school.id}`);

      let schoolClassesCreated = 0;
      let schoolClassesSkipped = 0;
      let schoolErrors = 0;

      // Create classes for each grade and stream combination
      for (const grade of GRADES) {
        for (const stream of STREAMS) {
          try {
            // Generate class name
            const gradeName = GRADE_DISPLAY_NAMES[grade];
            const className = `${gradeName} ${stream}`;

            // Check if class already exists using findFirst with proper where clause
            const existingClass = await prisma.class.findFirst({
              where: {
                grade: grade as any,
                institutionType: 'PRIMARY_CBC' as any,
                stream: stream,
                academicYear: ACADEMIC_YEAR,
                term: CURRENT_TERM as any
              }
            });

            if (existingClass) {
              console.log(`   ⏭️  ${className} already exists (ID: ${existingClass.id})`);
              schoolClassesSkipped++;
              totalSkipped++;
              continue;
            }

            // Create the class with schoolId
            const newClass = await prisma.class.create({
              data: {
                classCode: `CLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: className,
                grade: grade as any,
                institutionType: 'PRIMARY_CBC' as any,
                stream: stream,
                academicYear: ACADEMIC_YEAR,
                term: CURRENT_TERM as any,
                capacity: CLASS_CAPACITY,
                active: true,
                archived: false
              }
            });

            console.log(`   ✅ Created: ${className} (ID: ${newClass.id})`);
            schoolClassesCreated++;
            totalCreated++;

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`   ❌ Error creating class: ${errorMessage}`);
            schoolErrors++;
            totalErrors++;
          }
        }
      }

      // Create Senior School classes (Grade 10–12) under SECONDARY institution type
      for (const grade of SS_GRADES) {
        for (const stream of STREAMS) {
          try {
            const className = `Grade ${String(grade).replace('GRADE', '')} ${stream}`;
            const existingClass = await prisma.class.findFirst({
              where: {
                grade: grade as any,
                institutionType: 'SECONDARY' as any,
                stream: stream,
                academicYear: ACADEMIC_YEAR,
                term: CURRENT_TERM as any
              }
            });

            if (existingClass) {
              console.log(`   ⏭️  ${className} already exists (ID: ${existingClass.id})`);
              schoolClassesSkipped++;
              totalSkipped++;
              continue;
            }

            const newClass = await prisma.class.create({
              data: {
                classCode: `CLS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: className,
                grade: grade as any,
                institutionType: 'SECONDARY' as any,
                stream: stream,
                academicYear: ACADEMIC_YEAR,
                term: CURRENT_TERM as any,
                capacity: CLASS_CAPACITY,
                active: true,
                archived: false
              }
            });

            console.log(`   ✅ Created: ${className} (ID: ${newClass.id})`);
            schoolClassesCreated++;
            totalCreated++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`   ❌ Error creating class: ${errorMessage}`);
            schoolErrors++;
            totalErrors++;
          }
        }
      }

      // School summary
      console.log(`\n   📊 School Summary:`);
      console.log(`      Created: ${schoolClassesCreated}`);
      console.log(`      Skipped: ${schoolClassesSkipped}`);
      if (schoolErrors > 0) {
        console.log(`      Errors: ${schoolErrors}`);
      }
    }

    // Final summary
    console.log('\n' + '━'.repeat(70));
    console.log('📊 FINAL SUMMARY:');
    console.log('━'.repeat(70));
    console.log(`   Schools processed: ${schools.length}`);
    console.log(`   Total classes created: ${totalCreated}`);
    console.log(`   Total classes skipped (already exist): ${totalSkipped}`);
    if (totalErrors > 0) {
      console.log(`   Total errors: ${totalErrors}`);
    }
    console.log('━'.repeat(70));

    // Show current class state
    console.log('\n📋 Current Classes in Database:');
    console.log('━'.repeat(70));

    const totalClassCount = await prisma.class.count();
    console.log(`Total classes: ${totalClassCount}`);

    const classesGroupedByGrade = await prisma.class.groupBy({
      by: ['grade'],
      _count: true
    });

    for (const gradeGroup of classesGroupedByGrade) {
      const gradeName = GRADE_DISPLAY_NAMES[gradeGroup.grade as string] || gradeGroup.grade;
      console.log(`   └─ ${gradeName}: ${gradeGroup._count} stream(s)`);
    }

    console.log('━'.repeat(70));
    console.log('\n✨ Classes seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Critical error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedClasses().catch((error) => {
  console.error('🔥 Seeding failed:', error);
  process.exit(1);
});
