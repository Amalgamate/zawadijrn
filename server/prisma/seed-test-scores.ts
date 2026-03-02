import { PrismaClient, SummativeGrade, TestStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Function to calculate grade from marks
function calculateGrade(marks: number, totalMarks: number = 100): SummativeGrade {
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 80) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'E';
}

// Function to calculate status from marks
function calculateStatus(marks: number, totalMarks: number = 100): TestStatus {
  const percentage = (marks / totalMarks) * 100;
  return percentage >= 40 ? 'PASS' : 'FAIL';
}

// Generate realistic random score with skew towards higher marks
function generateRandomScore(maxMarks: number): number {
  const random = Math.random() + Math.random() + Math.random();
  const normalized = random / 3;
  return Math.round(normalized * maxMarks);
}

async function main() {
  console.log('🌱 Seeding test scores for all existing tests...\n');

  try {
    // Get the school
    const school = await prisma.school.findFirst();
    if (!school) {
      console.error('❌ No school found');
      return;
    }

    console.log(`🏫 School: ${school.name}\n`);

    // Get a user to record results (find first admin or teacher)
    const user = await prisma.user.findFirst({
      where: {
        schoolId: school.id,
        role: { in: ['ADMIN', 'TEACHER'] }
      }
    });

    if (!user) {
      console.error('❌ No admin/teacher user found to record results');
      return;
    }

    // Get all existing tests
    const tests = await prisma.summativeTest.findMany({
      where: {
        schoolId: school.id,
        active: true
      },
      include: {
        scale: true
      },
      orderBy: [
        { grade: 'asc' },
        { learningArea: 'asc' }
      ]
    });

    console.log(`📝 Found ${tests.length} tests\n`);

    if (tests.length === 0) {
      console.log('⚠️  No tests found. Please create tests first using the scale creation workflow.');
      return;
    }

    let totalResultsCreated = 0;
    let totalResultsSkipped = 0;

    // For each test, create scores for all students in that grade
    for (const test of tests) {
      if (!test.grade) {
        console.log(`⏭️  Skipping test "${test.title}" - No grade assigned`);
        continue;
      }

      // Get all learners in this grade
      const learners = await prisma.learner.findMany({
        where: {
          schoolId: school.id,
          grade: test.grade,
          archived: false
        }
      });

      if (learners.length === 0) {
        console.log(`⏭️  Skipping "${test.title}" - No students in ${test.grade}`);
        continue;
      }

      console.log(`📊 ${test.title} (${learners.length} students)`);

      // Create result for each learner
      for (const learner of learners) {
        // Check if result already exists
        const existingResult = await prisma.summativeResult.findFirst({
          where: {
            testId: test.id,
            learnerId: learner.id
          }
        });

        if (existingResult) {
          totalResultsSkipped++;
          continue;
        }

        // Generate random score
        const marksObtained = generateRandomScore(test.totalMarks);
        const percentage = (marksObtained / test.totalMarks) * 100;
        const grade = calculateGrade(marksObtained, test.totalMarks);
        const status = calculateStatus(marksObtained, test.totalMarks);

        // Create result
        await prisma.summativeResult.create({
          data: {
            testId: test.id,
            learnerId: learner.id,
            marksObtained,
            percentage,
            grade,
            status,
            schoolId: school.id,
            recordedBy: user.id,
            remarks: status === 'PASS' ? 'Well done!' : 'Needs improvement'
          }
        });

        totalResultsCreated++;
      }

      console.log(`   ✅ Created ${learners.length} scores\n`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ SEEDING COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Tests Found: ${tests.length}`);
    console.log(`✅ Results Created: ${totalResultsCreated}`);
    console.log(`⏭️  Results Skipped (already exist): ${totalResultsSkipped}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
