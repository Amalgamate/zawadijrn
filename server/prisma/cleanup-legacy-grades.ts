import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of legacy grades: CRECHE, RECEPTION, TRANSITION...');

  const legacyGrades = ['CRECHE', 'RECEPTION', 'TRANSITION'];

  // 1. Delete SubjectAssignments tied to legacy grades using raw SQL
  // (Since they aren't in the enum, Prisma client won't let us query them via ORM)
  const deletedAssignmentsCount = await prisma.$executeRaw`
    DELETE FROM "subject_assignments"
    WHERE "grade"::text IN ('CRECHE', 'RECEPTION', 'TRANSITION')
  `;
  console.log(`Deleted ${deletedAssignmentsCount} SubjectAssignments.`);

  // 2. Delete LearningAreas for legacy grades (this is a String field, so it works)
  const deletedAreas = await prisma.learningArea.deleteMany({
    where: {
      gradeLevel: {
        in: legacyGrades
      }
    }
  });
  console.log(`Deleted ${deletedAreas.count} LearningAreas.`);

  // 3. Optional: Check for Classes if needed
  // Since the user focused on "here" (Subject Allocation), and LearningAreas were the visible ones.

  console.log('Cleanup completed successfully.');
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
