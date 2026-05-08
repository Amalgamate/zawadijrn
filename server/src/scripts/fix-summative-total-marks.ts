import { PrismaClient } from '@prisma/client';
import { gradingService } from '../services/grading.service';

const prisma = new PrismaClient();
const TARGET_TOTAL_MARKS = 100;

async function main() {
  console.log('Starting global summative total-marks repair...');

  const cbcSystem = await gradingService.getGradingSystem('CBC');
  const cbcRanges = cbcSystem?.ranges || [];
  if (!cbcRanges.length) {
    throw new Error('CBC grading ranges are missing.');
  }

  const tests = await prisma.summativeTest.findMany({
    where: { totalMarks: { gt: TARGET_TOTAL_MARKS }, archived: false },
    select: {
      id: true,
      totalMarks: true,
      passMarks: true,
      scaleId: true,
      grade: true
    }
  });

  let testsPatched = 0;
  let resultsPatched = 0;
  let testsSkipped = 0;

  for (const test of tests) {
    const maxAgg = await prisma.summativeResult.aggregate({
      where: { testId: test.id, archived: false },
      _max: { marksObtained: true }
    });
    const maxMarks = Number(maxAgg._max.marksObtained || 0);

    // Only normalize obviously mis-scaled tests (scores entered out of 100 against totals >100).
    if (maxMarks > TARGET_TOTAL_MARKS) {
      testsSkipped++;
      continue;
    }

    const oldTotal = Number(test.totalMarks || TARGET_TOTAL_MARKS);
    const oldPass = Number(test.passMarks || 40);
    const normalizedPass = Math.max(0, Math.min(TARGET_TOTAL_MARKS, Math.round((oldPass / oldTotal) * TARGET_TOTAL_MARKS)));

    let gradeRanges: any[] = [];
    if (test.scaleId) {
      const byId = await gradingService.getGradingSystemById(test.scaleId);
      gradeRanges = byId?.ranges || [];
    }
    if (!gradeRanges.length) {
      const byType = await gradingService.getGradingSystem('SUMMATIVE' as any);
      gradeRanges = byType?.ranges || [];
    }

    await prisma.$transaction(async (tx) => {
      await tx.summativeTest.update({
        where: { id: test.id },
        data: {
          totalMarks: TARGET_TOTAL_MARKS,
          passMarks: normalizedPass
        }
      });

      const results = await tx.summativeResult.findMany({
        where: { testId: test.id, archived: false },
        select: { id: true, marksObtained: true }
      });

      for (const r of results) {
        const marks = Number(r.marksObtained || 0);
        const percentage = (marks / TARGET_TOTAL_MARKS) * 100;
        const grade = gradeRanges.length
          ? gradingService.calculateGradeSync(percentage, gradeRanges as any)
          : 'E';
        const cbcGrade = gradingService.calculateRatingSync(percentage, cbcRanges as any);
        const status = percentage >= normalizedPass ? 'PASS' : 'FAIL';

        await tx.summativeResult.update({
          where: { id: r.id },
          data: { percentage, grade, cbcGrade, status }
        });
      }

      resultsPatched += results.length;
    });

    testsPatched++;
  }

  console.log('Repair complete.');
  console.log(JSON.stringify({ testsPatched, resultsPatched, testsSkipped }, null, 2));
}

main()
  .catch((err) => {
    console.error('Repair failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
