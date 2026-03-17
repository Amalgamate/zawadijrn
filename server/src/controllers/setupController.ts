/**
 * Bulk Setup Functions - Called from CLI or Admin UI
 * These functions create scales and tests in bulk to eliminate repetitive setup
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { Grade, Term } from '@prisma/client';
import prisma from '../config/database';

// Define learning areas for each grade
const LEARNING_AREAS_CONFIG: Record<string, string[]> = {
  'PLAYGROUP': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
  'PP1': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
  'PP2': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
  'GRADE_1': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
  'GRADE_2': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
  'GRADE_3': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
  'GRADE_4': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
  'GRADE_5': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
  'GRADE_6': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
  'GRADE_7': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
  'GRADE_8': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
  'GRADE_9': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports']
};

/**
 * Bulk Create Grading Scales for entire school
 * POST /api/assessments/setup/create-scales
 */
export const bulkCreateGradingScales = async (req: AuthRequest, res: Response) => {
  try {
    const { overwrite = false } = req.body;

    let scaledCreated = 0;
    let scaleSSkipped = 0;
    const logs: string[] = [];

    const gradeRange = Object.keys(LEARNING_AREAS_CONFIG);

    // Standard grading ranges for all scales
    const gradingRanges = [
      { minPercentage: 80, maxPercentage: 100, minMarks: 80, maxMarks: 100, points: 4, grade: 'A', label: 'Excellent', color: '#10b981' },
      { minPercentage: 60, maxPercentage: 79, minMarks: 60, maxMarks: 79, points: 3, grade: 'B', label: 'Good', color: '#3b82f6' },
      { minPercentage: 50, maxPercentage: 59, minMarks: 50, maxMarks: 59, points: 2, grade: 'C', label: 'Average', color: '#f59e0b' },
      { minPercentage: 40, maxPercentage: 49, minMarks: 40, maxMarks: 49, points: 1, grade: 'D', label: 'Pass', color: '#f97316' },
      { minPercentage: 0, maxPercentage: 39, minMarks: 0, maxMarks: 39, points: 0, grade: 'E', label: 'Below Average', color: '#ef4444' }
    ];

    for (const grade of gradeRange) {
      const learningAreas = LEARNING_AREAS_CONFIG[grade] || [];

      for (const learningArea of learningAreas) {
        const scaleName = `${grade} - ${learningArea}`;

        // Check if already exists
        const existing = await prisma.gradingSystem.findFirst({
          where: {
            name: scaleName
          }
        });

        if (existing && !overwrite) {
          scaleSSkipped++;
          logs.push(`⏭️  Skipped: ${scaleName} (already exists)`);
          continue;
        }

        if (existing && overwrite) {
          // Delete existing and recreate
          await prisma.gradingSystem.delete({
            where: { id: existing.id }
          });
        }

        // Create new scale
        await prisma.gradingSystem.create({
          data: {
            name: scaleName,
            grade: grade as Grade,
            learningArea,
            type: 'SUMMATIVE',
            active: true,
            ranges: {
              create: gradingRanges.map((range) => ({
                minPercentage: range.minPercentage,
                maxPercentage: range.maxPercentage,
                minMarks: range.minMarks,
                maxMarks: range.maxMarks,
                points: range.points,
                summativeGrade: range.grade as any,
                label: range.label,
                color: range.color
              }))
            }
          }
        });

        scaledCreated++;
        logs.push(`✅ Created: ${scaleName}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully created ${scaledCreated} grading scales`,
      data: {
        created: scaledCreated,
        skipped: scaleSSkipped,
        logs
      }
    });

  } catch (error: any) {
    console.error('Error bulk creating grading scales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create grading scales',
      error: error.message
    });
  }
};

/**
 * Bulk Create Summative Tests for entire school
 * POST /api/assessments/setup/create-tests
 */
export const bulkCreateSummativeTests = async (req: AuthRequest, res: Response) => {
  try {
    const createdBy = req.user?.userId;
    const schoolId = req.schoolContext?.schoolId;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: 'User ID required'
      });
    }

    const {
      term = 'TERM_1',
      academicYear = new Date().getFullYear(),
      testType = 'SUMMATIVE',
      overwrite = false,
      weight = 1.0
    } = req.body;

    let testsCreated = 0;
    let testsSkipped = 0;
    const logs: string[] = [];

    // Get all grading scales
    const scales = await prisma.gradingSystem.findMany({
      where: {
        active: true,
        type: 'SUMMATIVE'
      }
    });

    if (scales.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No grading scales found for your school. Please create scales first.'
      });
    }

    // Create a test for each scale
    for (const scale of scales) {
      if (!scale.grade || !scale.learningArea) continue;

      let testTitle = `${scale.learningArea} Test - ${term}`;
      if (scale.scaleGroupId) {
        const scaleGroup = await prisma.scaleGroup.findUnique({
          where: { id: scale.scaleGroupId }
        });
        if (scaleGroup) {
          testTitle = `${scaleGroup.name} - ${scale.learningArea} Test - ${term}`;
        }
      }

      const existing = await prisma.summativeTest.findFirst({
        where: {
          grade: scale.grade as Grade,
          learningArea: scale.learningArea as string,
          term: term as Term,
          academicYear: parseInt(academicYear.toString())
        }
      });

      if (existing && !overwrite) {
        testsSkipped++;
        logs.push(`⏭️  Skipped: ${testTitle} (already exists)`);
        continue;
      }

      if (existing && overwrite) {
        await prisma.summativeResult.deleteMany({
          where: { testId: existing.id }
        });
        await prisma.summativeTest.delete({
          where: { id: existing.id }
        });
      }

      // Create new test
      await prisma.summativeTest.create({
        data: {
          title: testTitle,
          learningArea: scale.learningArea as string,
          term: term as Term,
          academicYear: parseInt(academicYear.toString()),
          grade: scale.grade as Grade,
          testDate: new Date(),
          totalMarks: 100,
          passMarks: 40,
          createdBy,
          scaleId: scale.id,
          status: 'PUBLISHED',
          weight: parseFloat(String(weight || 1.0)),
          published: true,
          active: true,
          description: `Summative assessment for ${scale.learningArea}`
        }
      });

      testsCreated++;
      logs.push(`✅ Created: ${testTitle}`);
    }

    res.json({
      success: true,
      message: `Successfully created ${testsCreated} summative tests`,
      data: {
        created: testsCreated,
        skipped: testsSkipped,
        logs
      }
    });

  } catch (error: any) {
    console.error('Error bulk creating summative tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create summative tests',
      error: error.message
    });
  }
};

/**
 * Complete School Setup
 * POST /api/assessments/setup/complete
 */
export const completeSchoolSetup = async (req: AuthRequest, res: Response) => {
  try {
    const createdBy = req.user?.userId;
    const schoolId = req.schoolContext?.schoolId;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: 'User ID required'
      });
    }

    const {
      term = 'TERM_1',
      academicYear = new Date().getFullYear(),
      overwrite = false,
      weight = 1.0
    } = req.body;

    const logs: string[] = [];

    // STEP 0: Create or get default Scale Group
    let defaultScaleGroup = await prisma.scaleGroup.findFirst({
      where: { name: 'Standard School Grading Scale' }
    });

    if (!defaultScaleGroup) {
      defaultScaleGroup = await prisma.scaleGroup.create({
        data: {
          name: 'Standard School Grading Scale',
          description: 'Default grading scale for all subjects',
          active: true
        }
      });
      logs.push(`✅ Created default scale group`);
    } else {
      logs.push(`✅ Using existing scale group`);
    }

    // STEP 1: Create Grading Scales
    let scalesCreated = 0;
    const gradeRange = Object.keys(LEARNING_AREAS_CONFIG);
    const gradingRanges = [
      { minPercentage: 80, maxPercentage: 100, minMarks: 80, maxMarks: 100, points: 4, grade: 'A', label: 'Excellent', color: '#10b981' },
      { minPercentage: 60, maxPercentage: 79, minMarks: 60, maxMarks: 79, points: 3, grade: 'B', label: 'Good', color: '#3b82f6' },
      { minPercentage: 50, maxPercentage: 59, minMarks: 50, maxMarks: 59, points: 2, grade: 'C', label: 'Average', color: '#f59e0b' },
      { minPercentage: 40, maxPercentage: 49, minMarks: 40, maxMarks: 49, points: 1, grade: 'D', label: 'Pass', color: '#f97316' },
      { minPercentage: 0, maxPercentage: 39, minMarks: 0, maxMarks: 39, points: 0, grade: 'E', label: 'Below Average', color: '#ef4444' }
    ];

    for (const grade of gradeRange) {
      const learningAreas = LEARNING_AREAS_CONFIG[grade] || [];

      for (const learningArea of learningAreas) {
        const scaleName = `${grade} - ${learningArea}`;
        const existing = await prisma.gradingSystem.findFirst({
          where: { 
            name: scaleName
          }
        });

        if (existing && !overwrite) continue;

        if (existing && overwrite) {
          await prisma.gradingSystem.delete({ where: { id: existing.id } });
        }

        await prisma.gradingSystem.create({
          data: {
            name: scaleName,
            grade: grade as Grade,
            learningArea,
            type: 'SUMMATIVE',
            active: true,
            scaleGroupId: defaultScaleGroup.id,
            ranges: {
              create: gradingRanges.map((range) => ({
                minPercentage: range.minPercentage,
                maxPercentage: range.maxPercentage,
                minMarks: range.minMarks,
                maxMarks: range.maxMarks,
                points: range.points,
                summativeGrade: range.grade as any,
                label: range.label,
                color: range.color
              }))
            }
          }
        });
        scalesCreated++;
      }
    }

    logs.push(`✅ Grading Scales Created: ${scalesCreated}`);

    // STEP 2: Create Tests
    let testsCreated = 0;
    const scales = await prisma.gradingSystem.findMany({
      where: { 
        active: true, 
        type: 'SUMMATIVE'
      }
    });

    for (const scale of scales) {
      if (!scale.grade || !scale.learningArea) continue;

      let testTitle = `${scale.learningArea} Test - ${term}`;
      if (scale.scaleGroupId) {
        const scaleGroup = await prisma.scaleGroup.findUnique({
          where: { id: scale.scaleGroupId }
        });
        if (scaleGroup) {
          testTitle = `${scaleGroup.name} - ${scale.learningArea} Test - ${term}`;
        }
      }

      const existing = await prisma.summativeTest.findFirst({
        where: {
          grade: scale.grade as Grade,
          learningArea: scale.learningArea as string,
          term: term as Term,
          academicYear: parseInt(academicYear.toString())
        }
      });

      if (existing && !overwrite) continue;

      if (existing && overwrite) {
        await prisma.summativeResult.deleteMany({ where: { testId: existing.id } });
        await prisma.summativeTest.delete({ where: { id: existing.id } });
      }

      await prisma.summativeTest.create({
        data: {
          title: testTitle,
          learningArea: scale.learningArea as string,
          term: term as Term,
          academicYear: parseInt(academicYear.toString()),
          grade: scale.grade as Grade,
          testDate: new Date(),
          totalMarks: 100,
          passMarks: 40,
          createdBy,
          scaleId: scale.id,
          weight: parseFloat(String(weight || 1.0)),
          status: 'PUBLISHED',
          published: true,
          active: true
        }
      });
      testsCreated++;
    }

    logs.push(`✅ Summative Tests Created: ${testsCreated}`);

    res.json({
      success: true,
      message: 'Complete school setup successful',
      data: {
        scalesCreated,
        testsCreated,
        logs
      }
    });

  } catch (error: any) {
    console.error('Error in complete school setup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete school setup',
      error: error.message
    });
  }
};

/**
 * Selective Database Reset
 * POST /api/assessments/setup/reset
 */
export const resetAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      summativeTests = false, 
      formativeAssessments = false, 
      gradingScales = false,
      assessmentAudits = false
    } = req.body;

    const results: Record<string, number> = {};

    if (summativeTests) {
      const srh = await prisma.summativeResultHistory.deleteMany();
      const sr = await prisma.summativeResult.deleteMany();
      const st = await prisma.summativeTest.deleteMany();
      results.summativeTestsDeleted = st.count;
      results.summativeResultsDeleted = sr.count;
      results.summativeHistoryDeleted = srh.count;
    }

    if (formativeAssessments) {
      const fa = await prisma.formativeAssessment.deleteMany();
      results.formativeAssessmentsDeleted = fa.count;
    }

    if (gradingScales) {
      // First delete ranges as they are children of GradingSystem
      await prisma.gradingRange.deleteMany();
      const gs = await prisma.gradingSystem.deleteMany();
      const sg = await prisma.scaleGroup.deleteMany();
      results.gradingScalesDeleted = gs.count;
      results.scaleGroupsDeleted = sg.count;
    }

    if (assessmentAudits) {
      const sa = await prisma.assessmentSmsAudit.deleteMany();
      results.smsAuditsDeleted = sa.count;
    }

    res.json({
      success: true,
      message: 'Selective reset completed successfully',
      data: results
    });

  } catch (error: any) {
    console.error('Error resetting assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset assessments',
      error: error.message
    });
  }
};

export default {
  bulkCreateGradingScales,
  bulkCreateSummativeTests,
  completeSchoolSetup,
  resetAssessments
};
