/**
 * Seed Learning Areas Script
 * Creates default learning areas for grades that have classes in the database
 * 
 * DEPENDENCY: Classes must be seeded first!
 * This ensures learning areas are only created for grades that actually have classes
 */

import prisma from '../src/config/database';

// Grade to learning area mappings (matching gradeStructure from frontend)
const GRADE_TO_LEARNING_AREA: { [key: string]: string } = {
  'PLAYGROUP': 'Pre-Primary',
  'PP1': 'Pre-Primary',
  'PP2': 'Pre-Primary',
  'GRADE_1': 'Lower Primary',
  'GRADE_2': 'Lower Primary',
  'GRADE_3': 'Lower Primary',
  'GRADE_4': 'Upper Primary',
  'GRADE_5': 'Upper Primary',
  'GRADE_6': 'Upper Primary',
  'GRADE_7': 'Junior School',
  'GRADE_8': 'Junior School',
  'GRADE_9': 'Junior School'
};

async function seedLearningAreas() {
  try {
    console.log('🌱 Starting learning areas seeding...\n');

    // Get all active schools
    const schools = await prisma.school.findMany({
      where: { active: true },
      select: { id: true, name: true }
    });

    if (schools.length === 0) {
      console.log('⚠️  No active schools found to seed.');
      return;
    }

    console.log(`📚 Found ${schools.length} active school(s) to seed\n`);

    // Grade level mappings and default areas
    const gradeLevelMappings: { [key: string]: string[] } = {
      'Pre-Primary': [
        'Literacy', 'English Language Activities', 'Mathematical Activities',
        'Environmental Activities', 'Creative Activities', 'Christian Religious Education',
        'Islamic Religious Education', 'Computer Studies (Interactive)', 'Kiswahili Lugha'
      ],
      'Lower Primary': [
        'Mathematics', 'English', 'Kiswahili', 'Environmental Studies',
        'Creative Activities', 'Religious Education', 'Information Communications Technology'
      ],
      'Upper Primary': [
        'English Language', 'Kiswahili Lugha', 'Mathematics', 'Science and Technology',
        'Social Studies', 'Agriculture', 'Creative Arts', 'Christian Religious Education',
        'Islamic Religious Education', 'Computer Studies', 'Coding and Robotics', 'French'
      ],
      'Junior School': [
        'English Language', 'Kiswahili Lugha', 'Mathematics', 'Integrated Science',
        'Social Studies', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts and Sports',
        'Christian Religious Education', 'Islamic Religious Education', 'Computer Studies',
        'Coding and Robotics', 'French'
      ]
    };

    const colors: { [key: string]: string } = {
      'Pre-Primary': '#8b5cf6',
      'Lower Primary': '#3b82f6',
      'Upper Primary': '#10b981',
      'Junior School': '#f59e0b'
    };

    const icons: { [key: string]: string } = {
      'Pre-Primary': '🎨',
      'Lower Primary': '📚',
      'Upper Primary': '🧪',
      'Junior School': '🧬'
    };

    // Seed globally for the whole system
    let totalCreated = 0;
    let totalSkipped = 0;

    console.log(`📋 Seeding global learning areas...`);

    // Get all grade levels from the mapping
    const gradeLevels = Object.keys(gradeLevelMappings);

    for (const gradeLevel of gradeLevels) {
      const areas = gradeLevelMappings[gradeLevel];

      for (const area of areas) {
        try {
          const existing = await prisma.learningArea.findFirst({
            where: {
              name: area,
              gradeLevel: gradeLevel
            }
          });

          if (existing) {
            totalSkipped++;
            continue;
          }

          // Specific short names for Lower Primary
          let shortName = area.split(' ')[0];
          if (gradeLevel === 'Lower Primary') {
            const mapping: { [key: string]: string } = {
              'Mathematics': 'Maths',
              'English': 'ENG',
              'Kiswahili': 'Kiswa',
              'Environmental Studies': 'ENV',
              'Creative Activities': 'CA',
              'Religious Education': 'RE',
              'Information Communications Technology': 'ICT'
            };
            shortName = mapping[area] || shortName;
          }

          await prisma.learningArea.create({
            data: {
              name: area,
              shortName,
              gradeLevel,
              icon: icons[gradeLevel] || '📚',
              color: colors[gradeLevel] || '#3b82f6'
            }
          });

          totalCreated++;
        } catch (error: any) {
          if (!error.message.includes('Unique constraint failed')) {
            console.error(`❌ Error creating area "${area}":`, error.message);
          }
          totalSkipped++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Learning areas seeding completed!');
    console.log(`   Total created: ${totalCreated}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    console.log('='.repeat(60));
    console.log('\n📝 Next steps:');
    console.log('   1. If schools were skipped, seed classes first: npm run seed:classes');
    console.log('   2. Then run this script again to seed learning areas');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedLearningAreas();
