/**
 * Performance Scale Seeder
 * Creates sample grading systems for different grades and learning areas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPerformanceScales() {
  console.log('🌱 Seeding Performance Scales...');

  // Get the first school (or create a default one)
  let school = await prisma.school.findFirst();
  
  if (!school) {
    console.log('📚 Creating default school...');
    school = await prisma.school.create({
      data: {
        name: 'Sample School',
        motto: 'Excellence in Education',
        county: 'Nairobi',
        address: '123 Education Street',
        phone: '+254700000000',
        email: 'info@sampleschool.ac.ke',
      },
    });
    console.log(`✅ Created school: ${school.name}`);
  }

  // Define learning areas
  const learningAreas = [
    'MATHEMATICAL ACTIVITIES',
    'ENGLISH LANGUAGE ACTIVITIES',
    'KISWAHILI LANGUAGE ACTIVITIES',
    'ENVIRONMENTAL ACTIVITIES',
    'CREATIVE ACTIVITIES',
    'RELIGIOUS EDUCATION'
  ];

  // Define grades
  const grades = [
    'GRADE 1',
    'GRADE 2',
    'GRADE 3',
    'GRADE 4',
    'GRADE 5',
    'GRADE 6'
  ];

  // CBC Performance Level Descriptions
  const performanceDescriptions = {
    4: '{{learner}} consistently and with high level of accuracy displays the knowledge, skills and attitudes/values as: excellent understanding, creative application, and exceptional problem-solving abilities.',
    3: '{{learner}} displays the knowledge, skills and attitudes/values as: good understanding, appropriate application, and effective problem-solving abilities.',
    2: '{{learner}} displays the knowledge, skills and attitudes/values as: basic understanding, simple application, and developing problem-solving abilities.',
    1: '{{learner}} attempts to display the knowledge, skills and attitude: limited understanding, needs support for application, and requires guidance in problem-solving.'
  };

  // Define color scheme
  const colors = {
    4: '#10b981', // Green
    3: '#3b82f6', // Blue
    2: '#f59e0b', // Yellow/Amber
    1: '#ef4444'  // Red
  };

  let createdCount = 0;
  let skippedCount = 0;

  // Create grading systems for each grade and learning area
  for (const grade of grades) {
    for (const area of learningAreas) {
      const systemName = `${grade} - ${area}`;
      
      // Check if system already exists
      const existing = await prisma.gradingSystem.findFirst({
        where: {
          schoolId: school.id,
          name: systemName
        }
      });

      if (existing) {
        console.log(`⏭️  Skipping existing: ${systemName}`);
        skippedCount++;
        continue;
      }

      // Create the grading system with ranges
      await prisma.gradingSystem.create({
        data: {
          schoolId: school.id,
          name: systemName,
          type: 'SUMMATIVE',
          active: true,
          isDefault: false,
          ranges: {
            create: [
              {
                label: 'Level 4',
                minPercentage: 80,
                maxPercentage: 100,
                points: 4,
                description: performanceDescriptions[4],
                rubricRating: 'EE4',
                color: colors[4],
                summativeGrade: 'A'
              },
              {
                label: 'Level 3',
                minPercentage: 50,
                maxPercentage: 79.99,
                points: 3,
                description: performanceDescriptions[3],
                rubricRating: 'EE3',
                color: colors[3],
                summativeGrade: 'B'
              },
              {
                label: 'Level 2',
                minPercentage: 30,
                maxPercentage: 49.99,
                points: 2,
                description: performanceDescriptions[2],
                rubricRating: 'EE2',
                color: colors[2],
                summativeGrade: 'C'
              },
              {
                label: 'Level 1',
                minPercentage: 0,
                maxPercentage: 29.99,
                points: 1,
                description: performanceDescriptions[1],
                rubricRating: 'EE1',
                color: colors[1],
                summativeGrade: 'D'
              }
            ]
          }
        }
      });

      console.log(`✅ Created: ${systemName}`);
      createdCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${createdCount} grading systems`);
  console.log(`   ⏭️  Skipped: ${skippedCount} existing systems`);
  console.log(`   🎯 Total: ${createdCount + skippedCount} systems`);
}

async function main() {
  try {
    await seedPerformanceScales();
    console.log('\n🎉 Performance Scale seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding performance scales:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedPerformanceScales };
