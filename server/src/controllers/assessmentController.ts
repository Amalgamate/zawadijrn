import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { gradingService } from '../services/grading.service';
import { auditService } from '../services/audit.service';
import { AssessmentStatus, CurriculumType, Grade } from '@prisma/client';

// ============================================
// FORMATIVE ASSESSMENT CONTROLLERS
// ============================================

/**
 * Get Formative Assessments (with filters)
 * GET /api/assessments/formative
 */
export const getFormativeAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const { grade, term, academicYear, learningArea } = req.query;

    const whereClause: any = { archived: false };

    if (grade) whereClause.grade = grade;
    if (term) whereClause.term = term;
    if (academicYear) whereClause.academicYear = parseInt(academicYear as string);
    if (learningArea) whereClause.learningArea = learningArea;

    const assessments = await prisma.formativeAssessment.findMany({
      where: whereClause,
      include: {
        learner: {
          select: { firstName: true, lastName: true, admissionNumber: true }
        },
        teacher: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error: any) {
    console.error('Error fetching formative assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessments',
      error: error.message
    });
  }
};

/**
 * Create a new Formative Assessment
 * POST /api/assessments/formative
 */
export const createFormativeAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      learnerId,
      learningArea,
      strand,
      subStrand,
      grade,
      term,
      academicYear,
      overallRating,
      detailedRating,
      teacherComment,
      nextSteps,
      weight = 0
    } = req.body;

    const teacherId = req.user?.userId;

    if (!teacherId || !learnerId || !learningArea || !overallRating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const assessment = await prisma.formativeAssessment.create({
      data: {
        learnerId,
        teacherId,
        learningArea,
        strand,
        subStrand,
        term,
        academicYear: parseInt(academicYear),
        overallRating,
        detailedRating,
        weight: Number(weight)
      }
    });

    await auditService.logChange({
      entityType: 'FormativeAssessment',
      entityId: assessment.id,
      action: 'CREATE',
      userId: teacherId,
      reason: 'Formative assessment created via API'
    });

    res.status(201).json({
      success: true,
      data: assessment
    });

  } catch (error: any) {
    console.error('Error creating formative assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment',
      error: error.message
    });
  }
};

/**
 * Record Formative Results Bulk
 * POST /api/assessments/formative/bulk
 */
export const recordFormativeResultsBulk = async (req: AuthRequest, res: Response) => {
  try {
    const { assessments } = req.body;
    const teacherId = req.user?.userId;

    if (!teacherId || !Array.isArray(assessments)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const created = await prisma.$transaction(
      assessments.map((a: any) =>
        prisma.formativeAssessment.create({
          data: {
            ...a,
            teacherId,
            academicYear: parseInt(a.academicYear)
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Successfully recorded ${created.length} assessments`,
      data: created
    });

  } catch (error: any) {
    console.error('Error bulk recording formative assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record bulk assessments',
      error: error.message
    });
  }
};

/**
 * Get Formative Assessments for a Learner
 * GET /api/assessments/formative/learner/:learnerId
 */
export const getFormativeByLearner = async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { term, academicYear } = req.query;

    const whereClause: any = { learnerId, archived: false };

    if (term) whereClause.term = term;
    if (academicYear) whereClause.academicYear = parseInt(academicYear as string);

    const assessments = await prisma.formativeAssessment.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error: any) {
    console.error('Error fetching learner formative assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
};

/**
 * Delete Formative Assessment
 * DELETE /api/assessments/formative/:id
 */
export const deleteFormativeAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.formativeAssessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    await prisma.formativeAssessment.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date(),
        archivedBy: req.user?.userId
      }
    });

    res.json({
      success: true,
      message: 'Assessment archived successfully'
    });

  } catch (error: any) {
    console.error('Error deleting formative assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assessment',
      error: error.message
    });
  }
};

// ============================================
// SUMMATIVE TEST CONTROLLERS
// ============================================

/**
 * Create a new Summative Test
 * POST /api/assessments/summative
 */
export const createSummativeTest = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      learningArea,
      testType,
      term,
      academicYear,
      testDate,
      totalMarks = 100,
      passMarks = 40,
      description,
      grade,
      stream,
      curriculum = 'CBC',
      scaleId
    } = req.body;

    const teacherId = req.user?.userId;

    if (!teacherId || !title || !learningArea || !term || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const test = await prisma.summativeTest.create({
      data: {
        title,
        learningArea,
        testType,
        term,
        academicYear: parseInt(academicYear),
        testDate: testDate ? new Date(testDate) : new Date(),
        totalMarks: parseInt(totalMarks),
        passMarks: parseInt(passMarks),
        description,
        grade,
        curriculum,
        scaleId,
        createdBy: teacherId
      }
    });

    await auditService.logChange({
      entityType: 'SummativeTest',
      entityId: test.id,
      action: 'CREATE',
      userId: teacherId,
      reason: 'Summative test created via API'
    });

    res.status(201).json({
      success: true,
      data: test
    });

  } catch (error: any) {
    console.error('Error creating summative test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test',
      error: error.message
    });
  }
};

/**
 * Bulk Generate Tests for multiple learning areas
 * POST /api/assessments/summative/bulk-generate
 */
export const generateTestsBulk = async (req: AuthRequest, res: Response) => {
  try {
    const {
      learningAreas,
      grade,
      term,
      academicYear,
      testType,
      testDate,
      totalMarks = 100,
      passMarks = 40,
      stream,
      curriculum = 'CBC'
    } = req.body;

    const teacherId = req.user?.userId;

    if (!learningAreas || !Array.isArray(learningAreas) || !grade || !term || !academicYear || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required configuration'
      });
    }

    const createdTests = [];

    for (const area of learningAreas) {
      const test = await prisma.summativeTest.create({
        data: {
          title: `${area} - ${testType} - ${term} ${academicYear}`,
          learningArea: area,
          testType,
          term,
          academicYear: parseInt(academicYear),
          testDate: testDate ? new Date(testDate) : new Date(),
          totalMarks: parseInt(totalMarks),
          passMarks: parseInt(passMarks),
          grade,
          curriculum,
          createdBy: teacherId
        }
      });
      createdTests.push(test);
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdTests.length} tests`,
      data: createdTests
    });

  } catch (error: any) {
    console.error('Error bulk generating tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk generate tests',
      error: error.message
    });
  }
};

/**
 * Get Summative Tests (with filters)
 * GET /api/assessments/summative
 */
export const getSummativeTests = async (req: AuthRequest, res: Response) => {
  try {
    const { term, academicYear, grade, stream, learningArea } = req.query;

    const whereClause: any = { archived: false };

    if (term) whereClause.term = term;
    if (academicYear) whereClause.academicYear = parseInt(academicYear as string);
    if (grade) whereClause.grade = grade;
    if (stream) whereClause.stream = stream;
    if (learningArea) whereClause.learningArea = learningArea;

    const tests = await prisma.summativeTest.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        },
        _count: {
          select: { results: true }
        }
      },
      orderBy: { testDate: 'desc' }
    });

    res.json({
      success: true,
      data: tests,
      count: tests.length
    });
  } catch (error: any) {
    console.error('Error fetching summative tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tests',
      error: error.message
    });
  }
};

/**
 * Get a Specific Summative Test
 * GET /api/assessments/summative/:id
 */
export const getSummativeTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const test = await prisma.summativeTest.findUnique({
      where: { id },
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        },
        results: {
          include: {
            learner: {
              select: { firstName: true, lastName: true, admissionNumber: true }
            }
          }
        },
        _count: {
          select: { results: true }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    res.json({
      success: true,
      data: test
    });

  } catch (error: any) {
    console.error('Error fetching summative test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test details',
      error: error.message
    });
  }
};

/**
 * Update Summative Test
 * PUT /api/assessments/summative/:id
 */
export const updateSummativeTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const test = await prisma.summativeTest.findUnique({
      where: { id }
    });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const updatedTest = await prisma.summativeTest.update({
      where: { id },
      data: {
        ...updateData,
        academicYear: updateData.academicYear ? parseInt(updateData.academicYear) : undefined,
        totalMarks: updateData.totalMarks ? parseInt(updateData.totalMarks) : undefined,
        passMarks: updateData.passMarks ? parseInt(updateData.passMarks) : undefined,
        testDate: updateData.testDate ? new Date(updateData.testDate) : undefined
      }
    });

    await auditService.logChange({
      entityType: 'SummativeTest',
      entityId: id,
      action: 'UPDATE',
      userId: req.user?.userId || 'SYSTEM',
      reason: 'Summative test updated via API'
    });

    res.json({
      success: true,
      data: updatedTest
    });

  } catch (error: any) {
    console.error('Error updating summative test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test',
      error: error.message
    });
  }
};

/**
 * Delete Summative Test
 * DELETE /api/assessments/summative/:id
 */
export const deleteSummativeTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const test = await prisma.summativeTest.findUnique({
      where: { id }
    });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const hasResults = await prisma.summativeResult.count({
      where: { testId: id }
    });

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      await prisma.$transaction([
        prisma.summativeResult.deleteMany({ where: { testId: id } }),
        prisma.summativeTest.delete({ where: { id } })
      ]);

      res.json({
        success: true,
        message: 'Test and associated results permanently deleted by Super Admin'
      });
    } else {
      if (hasResults > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete test with recorded results. Archive it instead.'
        });
      }

      await prisma.summativeTest.update({
        where: { id },
        data: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: req.user?.userId
        }
      });

      res.json({
        success: true,
        message: 'Test archived successfully'
      });
    }

  } catch (error: any) {
    console.error('Error deleting summative test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test',
      error: error.message
    });
  }
};

/**
 * Bulk Delete Summative Tests
 * DELETE /api/assessments/summative/bulk
 */
export const deleteSummativeTestsBulk = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid test IDs' });
    }

    const tests = await prisma.summativeTest.findMany({
      where: { id: { in: ids } }
    });

    if (tests.length === 0) {
      return res.status(404).json({ success: false, message: 'No tests found' });
    }

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      await prisma.$transaction([
        prisma.summativeResult.deleteMany({ where: { testId: { in: ids } } }),
        prisma.summativeTest.deleteMany({ where: { id: { in: ids } } })
      ]);
      res.json({ success: true, message: 'Tests permanently deleted' });
    } else {
      await prisma.summativeTest.updateMany({
        where: { id: { in: ids } },
        data: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: req.user?.userId
        }
      });
      res.json({ success: true, message: 'Tests archived successfully' });
    }

  } catch (error: any) {
    console.error('Error bulk deleting tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete tests',
      error: error.message
    });
  }
};

// ============================================
// SUMMATIVE RESULTS CONTROLLERS
// ============================================

/**
 * Record Summative Result (Single)
 * POST /api/assessments/summative/results
 */
export const recordSummativeResult = async (req: AuthRequest, res: Response) => {
  try {
    const { testId, learnerId, marksObtained, remarks, teacherComment } = req.body;
    const recordedBy = req.user?.userId;

    if (!recordedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!testId || !learnerId || marksObtained === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const test = await prisma.summativeTest.findUnique({
      where: { id: testId },
      select: { id: true, totalMarks: true, passMarks: true, scaleId: true }
    });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const marks = Number(marksObtained);
    if (isNaN(marks) || marks < 0 || marks > test.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Invalid marks. Must be between 0 and ${test.totalMarks}`
      });
    }

    let gradingSystem;
    if (test.scaleId) {
      gradingSystem = await gradingService.getGradingSystemById(test.scaleId);
    }
    if (!gradingSystem) {
      gradingSystem = await gradingService.getGradingSystem('SUMMATIVE');
    }
    const ranges = gradingSystem?.ranges;

    const percentage = (marks / test.totalMarks) * 100;
    const grade = ranges ? gradingService.calculateGradeSync(percentage, ranges) : 'E';
    const status = percentage >= test.passMarks ? 'PASS' : 'FAIL';

    let finalRemarks = remarks;
    if (!finalRemarks && ranges) {
      const matchedRange = ranges.find((r: any) => percentage >= r.minPercentage && percentage <= r.maxPercentage);
      if (matchedRange) finalRemarks = matchedRange.description || matchedRange.label;
    }

    const existingResult = await prisma.summativeResult.findUnique({
      where: { testId_learnerId: { testId, learnerId } }
    });

    const actionType = existingResult ? 'UPDATE' : 'CREATE';
    const oldValues = existingResult ? { marksObtained: existingResult.marksObtained } : {};

    const result = await prisma.summativeResult.upsert({
      where: { testId_learnerId: { testId, learnerId } },
      update: {
        marksObtained: marks,
        percentage,
        grade,
        status,
        recordedBy,
        remarks: finalRemarks,
        teacherComment
      },
      create: {
        testId,
        learnerId,
        marksObtained: marks,
        percentage,
        grade,
        status,
        recordedBy,
        remarks: finalRemarks,
        teacherComment
      }
    });

    await prisma.summativeResultHistory.create({
      data: {
        resultId: result.id,
        action: actionType,
        field: 'marksObtained',
        oldValue: oldValues.marksObtained ? String(oldValues.marksObtained) : null,
        newValue: String(marks),
        changedBy: recordedBy,
        reason: `Summative result ${actionType.toLowerCase()} via API`
      }
    });

    res.status(existingResult ? 200 : 201).json({
      success: true,
      message: existingResult ? 'Result updated successfully' : 'Result recorded successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Error recording summative result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record result',
      error: error.message
    });
  }
};

/**
 * Get Summative Results for a Learner
 * GET /api/assessments/summative/results/learner/:learnerId
 */
export const getSummativeByLearner = async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { term, academicYear } = req.query;

    const whereClause: any = { learnerId };

    if (term || academicYear) {
      whereClause.test = {};
      if (term) whereClause.test.term = term;
      if (academicYear) whereClause.test.academicYear = parseInt(academicYear as string);
    }

    const results = await prisma.summativeResult.findMany({
      where: whereClause,
      include: {
        test: {
          select: {
            title: true,
            learningArea: true,
            testType: true,
            term: true,
            academicYear: true,
            totalMarks: true,
            passMarks: true,
            testDate: true,
            status: true,
            curriculum: true,
            scaleId: true
          }
        },
        recorder: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: [
        { test: { academicYear: 'desc' } },
        { test: { testDate: 'desc' } }
      ]
    });

    const communicationLogs = await prisma.assessmentSmsAudit.findMany({
      where: {
        learnerId,
        term: term as string || undefined,
        academicYear: academicYear ? parseInt(academicYear as string) : undefined,
        assessmentType: 'SUMMATIVE',
        smsStatus: 'SENT'
      },
      select: { channel: true, sentAt: true },
      orderBy: { sentAt: 'desc' }
    });

    res.json({
      success: true,
      data: results,
      count: results.length,
      communication: {
        hasSentSms: communicationLogs.some(log => log.channel === 'SMS'),
        hasSentWhatsApp: communicationLogs.some(log => log.channel === 'WHATSAPP'),
        lastSmsAt: communicationLogs.find(log => log.channel === 'SMS')?.sentAt,
        lastWhatsAppAt: communicationLogs.find(log => log.channel === 'WHATSAPP')?.sentAt
      }
    });

  } catch (error: any) {
    console.error('Error fetching summative results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
};

/**
 * Get Results for a Specific Test
 * GET /api/assessments/summative/results/test/:testId
 */
export const getTestResults = async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;

    const results = await prisma.summativeResult.findMany({
      where: { testId },
      include: {
        learner: {
          select: { firstName: true, lastName: true, admissionNumber: true, grade: true }
        }
      },
      orderBy: { marksObtained: 'desc' }
    });

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error: any) {
    console.error('Error fetching test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
};

/**
 * Get Bulk Summative Results for a class/grade/stream
 * GET /api/assessments/summative/results/bulk?grade=...&stream=...&academicYear=...&term=...
 */
export const getBulkSummativeResults = async (req: AuthRequest, res: Response) => {
  try {
    const { grade, stream, academicYear, term } = req.query;

    if (!grade || !academicYear || !term) {
      return res.status(400).json({ success: false, message: 'Missing required filters: grade, academicYear, term' });
    }

    const whereClause: any = {
      learner: {
        grade: grade as Grade,
        ...(stream ? { stream: stream as string } : {})
      },
      test: {
        academicYear: parseInt(academicYear as string),
        term: term as string,
        archived: false
      }
    };

    const results = await prisma.summativeResult.findMany({
      where: whereClause,
      include: {
        learner: {
          select: { id: true, firstName: true, lastName: true, admissionNumber: true, stream: true }
        },
        test: {
          select: { id: true, title: true, learningArea: true, totalMarks: true, testType: true }
        }
      },
      orderBy: [
        { learner: { firstName: 'asc' } },
        { test: { learningArea: 'asc' } }
      ]
    });

    const learnerIds = Array.from(new Set(results.map(r => r.learnerId)));

    const communicationLogs = await prisma.assessmentSmsAudit.findMany({
      where: {
        learnerId: { in: learnerIds },
        term: term as string || undefined,
        academicYear: parseInt(academicYear as string) || undefined,
        assessmentType: 'SUMMATIVE',
        smsStatus: 'SENT'
      },
      select: { learnerId: true, channel: true, sentAt: true },
      orderBy: { sentAt: 'desc' }
    });

    const communications = learnerIds.map(id => {
      const logs = communicationLogs.filter(l => l.learnerId === id);
      return {
        learnerId: id,
        hasSentSms: logs.some(log => log.channel === 'SMS'),
        hasSentWhatsApp: logs.some(log => log.channel === 'WHATSAPP'),
        lastSmsAt: logs.find(log => log.channel === 'SMS')?.sentAt,
        lastWhatsAppAt: logs.find(log => log.channel === 'WHATSAPP')?.sentAt
      };
    });

    res.json({
      success: true,
      data: results,
      count: results.length,
      communications
    });

  } catch (error: any) {
    console.error('Error fetching bulk summative results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk results',
      error: error.message
    });
  }
};

/**
 * Record Summative Results (Bulk)
 * POST /api/assessments/summative/results/bulk
 */
export const recordSummativeResultsBulk = async (req: AuthRequest, res: Response) => {
  try {
    const { testId, results } = req.body;
    const recordedBy = req.user?.userId;

    if (!recordedBy) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!testId || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const test = await prisma.summativeTest.findUnique({
      where: { id: testId },
      select: { id: true, totalMarks: true, passMarks: true, scaleId: true }
    });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    let gradingSystem;
    if (test.scaleId) {
      gradingSystem = await gradingService.getGradingSystemById(test.scaleId);
    }
    if (!gradingSystem) {
      gradingSystem = await gradingService.getGradingSystem('SUMMATIVE');
    }
    const ranges = gradingSystem?.ranges;

    await prisma.$transaction(async (tx) => {
      for (const item of results) {
        if (item.marksObtained === undefined || item.marksObtained === null || item.marksObtained === '') continue;

        const marks = Number(item.marksObtained);
        if (isNaN(marks) || marks < 0 || marks > test.totalMarks) continue;

        const percentage = (marks / test.totalMarks) * 100;
        const grade = ranges ? gradingService.calculateGradeSync(percentage, ranges) : 'E';
        const status = percentage >= test.passMarks ? 'PASS' : 'FAIL';

        let remarks = item.remarks;
        if (!remarks && ranges) {
          const matchedRange = ranges.find((r: any) => percentage >= r.minPercentage && percentage <= r.maxPercentage);
          if (matchedRange) remarks = matchedRange.label;
        }

        const existingRecord = await tx.summativeResult.findUnique({
          where: { testId_learnerId: { testId, learnerId: item.learnerId } },
          select: { id: true, marksObtained: true }
        });

        const updatedResult = await tx.summativeResult.upsert({
          where: { testId_learnerId: { testId, learnerId: item.learnerId } },
          update: {
            marksObtained: marks,
            percentage,
            grade,
            status,
            recordedBy,
            remarks,
            teacherComment: item.teacherComment
          },
          create: {
            testId,
            learnerId: item.learnerId,
            marksObtained: marks,
            percentage,
            grade,
            status,
            recordedBy,
            remarks,
            teacherComment: item.teacherComment
          }
        });

        await tx.summativeResultHistory.create({
          data: {
            resultId: updatedResult.id,
            action: existingRecord ? 'UPDATE' : 'CREATE',
            field: 'marksObtained',
            oldValue: existingRecord?.marksObtained ? String(existingRecord.marksObtained) : null,
            newValue: String(marks),
            changedBy: recordedBy,
            reason: `Summative result recorded via bulk API`
          }
        });
      }
    });

    const allResults = await prisma.summativeResult.findMany({
      where: { testId },
      orderBy: { marksObtained: 'desc' },
      select: { id: true }
    });

    const updatePromises = allResults.map((r, index) =>
      prisma.summativeResult.update({
        where: { id: r.id },
        data: { position: index + 1, outOf: allResults.length }
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Successfully recorded ${results.length} results`
    });

  } catch (error: any) {
    console.error('Error bulk recording summative results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record results',
      error: error.message
    });
  }
};
