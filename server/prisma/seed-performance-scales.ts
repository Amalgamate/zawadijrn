import { PrismaClient, DetailedRubricRating } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed performance scales for all grades...');

  const schoolId = 'default-school-e082e9a4';

  // Define grades and their learning areas
  const gradesConfig = [
    {
      grade: 'PLAYGROUP',
      learningAreas: ['MATHEMATICAL ACTIVITIES', 'ENGLISH LANGUAGE ACTIVITIES', 'KISWAHILI ACTIVITIES', 'ENVIRONMENTAL ACTIVITIES']
    },
    {
      grade: 'PRE-PRIMARY 1',
      learningAreas: ['MATHEMATICAL ACTIVITIES', 'ENGLISH LANGUAGE ACTIVITIES', 'KISWAHILI ACTIVITIES', 'ENVIRONMENTAL ACTIVITIES', 'CREATIVE ACTIVITIES']
    },
    {
      grade: 'PRE-PRIMARY 2',
      learningAreas: ['MATHEMATICAL ACTIVITIES', 'ENGLISH LANGUAGE ACTIVITIES', 'KISWAHILI ACTIVITIES', 'ENVIRONMENTAL ACTIVITIES', 'CREATIVE ACTIVITIES']
    },
    {
      grade: 'GRADE 1',
      learningAreas: ['MATHEMATICS', 'ENGLISH', 'KISWAHILI', 'SCIENCE', 'SOCIAL STUDIES']
    },
    {
      grade: 'GRADE 2',
      learningAreas: ['MATHEMATICS', 'ENGLISH', 'KISWAHILI', 'SCIENCE', 'SOCIAL STUDIES']
    },
    {
      grade: 'GRADE 3',
      learningAreas: ['MATHEMATICS', 'ENGLISH', 'KISWAHILI', 'SCIENCE', 'SOCIAL STUDIES']
    },
    {
      grade: 'GRADE 4',
      learningAreas: ['MATHEMATICS', 'ENGLISH', 'KISWAHILI', 'SCIENCE', 'SOCIAL STUDIES', 'CRE/IRE']
    },
    {
      grade: 'GRADE 5',
      learningAreas: ['MATHEMATICS', 'ENGLISH', 'KISWAHILI', 'SCIENCE', 'SOCIAL STUDIES', 'CRE/IRE']
    },
    {
      grade: 'GRADE 6',
      learningAreas: ['MATHEMATICS', 'ENGLISH', 'KISWAHILI', 'SCIENCE', 'SOCIAL STUDIES', 'CRE/IRE']
    }
  ];

  // Standard 4-level rubric for all grades
  const standardRanges = [
    {
      label: 'Level 4',
      minPercentage: 80,
      maxPercentage: 100,
      points: 4,
      color: '#10b981',
      rubricRating: 'EE1' as DetailedRubricRating
    },
    {
      label: 'Level 3',
      minPercentage: 50,
      maxPercentage: 79,
      points: 3,
      color: '#3b82f6',
      rubricRating: 'ME1' as DetailedRubricRating
    },
    {
      label: 'Level 2',
      minPercentage: 30,
      maxPercentage: 49,
      points: 2,
      color: '#f59e0b',
      rubricRating: 'AE1' as DetailedRubricRating
    },
    {
      label: 'Level 1',
      minPercentage: 1,
      maxPercentage: 29,
      points: 1,
      color: '#ef4444',
      rubricRating: 'BE1' as DetailedRubricRating
    }
  ];

  let totalCreated = 0;

  for (const gradeConfig of gradesConfig) {
    console.log(`\n📚 Creating scales for ${gradeConfig.grade}...`);

    for (const learningArea of gradeConfig.learningAreas) {
      const scaleName = `${gradeConfig.grade} - ${learningArea}`;

      // Check if scale already exists
      const existing = await prisma.gradingSystem.findFirst({
        where: {
          schoolId,
          name: scaleName
        }
      });

      if (existing) {
        console.log(`  ⏭️  Skipped: ${scaleName} (already exists)`);
        continue;
      }

      // Create description based on learning area
      const descriptions = standardRanges.map(range => {
        let desc = '';
        if (range.points === 4) {
          desc = `{{learner}} consistently and with high level of accuracy displays the knowledge, skills and attitudes/values in ${learningArea.toLowerCase()}.`;
        } else if (range.points === 3) {
          desc = `{{learner}} displays the knowledge, skills and attitudes/values in ${learningArea.toLowerCase()}.`;
        } else if (range.points === 2) {
          desc = `{{learner}} displays some knowledge, skills and attitudes/values in ${learningArea.toLowerCase()}.`;
        } else {
          desc = `{{learner}} attempts to display the knowledge, skills and attitudes in ${learningArea.toLowerCase()}.`;
        }
        return {
          description: desc,
          label: range.label,
          minPercentage: range.minPercentage,
          maxPercentage: range.maxPercentage,
          points: range.points,
          color: range.color,
          rubricRating: range.rubricRating
        };
      });

      // Create the scale
      await prisma.gradingSystem.create({
        data: {
          schoolId,
          name: scaleName,
          type: 'CBC',
          active: true,
          isDefault: false,
          ranges: {
            create: descriptions
          }
        }
      });

      console.log(`  ✅ Created: ${scaleName}`);
      totalCreated++;
    }
  }

  console.log('\n✨ Seeding completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`- Total scales created: ${totalCreated}`);
  console.log(`- Grades covered: ${gradesConfig.length}`);
  console.log(`- All scales use 4-level CBC rubric (Level 1-4)`);
  console.log('\n🎉 Performance scales are ready to use!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding performance scales:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
