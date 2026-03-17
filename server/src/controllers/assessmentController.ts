import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { gradingService } from '../services/grading.service';
import { auditService } from '../services/audit.service';
import { AssessmentStatus, CurriculumType, Grade } from '@prisma/client';
import { aiAssistantService } from '../services/ai-assistant.service';
import { detailedToGeneralRating } from '../utils/rubric.util';

// ============================================
// FORMATIVE ASSESSMENT CONTROLLERS
// ============================================

/**
 * Get Formative Assessments (with filters)
 * GET /api/assessments/formative
 */
export const getFormativeAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const { grade, term, academicYear, learningArea, strand } = req.query;

    const whereClause: any = { archived: false };

    if (grade) whereClause.learner = { grade };
    if (term) whereClause.term = term;
    if (academicYear) whereClause.academicYear = parseInt(academicYear as string);
    if (learningArea) whereClause.learningArea = learningArea;
    if (strand) whereClause.strand = strand;

    const assessments = await prisma.formativeAssessment.findMany({
      where: whereClause,
      include: {
        learner: {
          select: { firstName: true, lastName: true, admissionNumber: true, grade: true }
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
 * Get Bulk Formative Results for a class/grade/stream
 * GET /api/assessments/formative/bulk?grade=...&stream=...&academicYear=...&term=...
 */
export const getBulkFormativeResults = async (req: AuthRequest, res: Response) => {
  try {
    const { grade, stream, academicYear, term, learningArea } = req.query;

    if (!grade || !academicYear || !term) {
      return res.status(400).json({
        success: false,
        message: 'Missing required filters: grade, academicYear, term'
      });
    }

    const whereClause: any = {
      archived: false,
      learner: {
        grade: grade as Grade,
        ...(stream ? { stream: stream as string } : {})
      },
      term: String(term).toUpperCase().replace(/\s+/g, '_'),
      academicYear: parseInt(academicYear as string)
    };

    if (learningArea) whereClause.learningArea = learningArea;

    const assessments = await prisma.formativeAssessment.findMany({
      where: whereClause,
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            grade: true,
            stream: true
          }
        },
        teacher: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: [
        { learner: { firstName: 'asc' } },
        { learningArea: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: assessments,
      count: assessments.length
    });
  } catch (error: any) {
    console.error('Error fetching bulk formative results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk formative results',
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
      term,
      academicYear,
      overallRating,
      detailedRating,
      teacherComment,
      nextSteps,
      weight = 0,
      title = '',
      type = 'OTHER'
    } = req.body;

    const teacherId = req.user?.userId;

    if (!teacherId || !learnerId || !learningArea || !overallRating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: learnerId, learningArea, overallRating'
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
        weight: Number(weight),
        title,
        type
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
    const teacherId = req.user?.userId;
    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let assessments: any[];

    if (Array.isArray(req.body.assessments)) {
      assessments = req.body.assessments;
    } else if (Array.isArray(req.body.results)) {
      const {
        results,
        term,
        academicYear,
        learningArea,
        strand,
        subStrand,
        title = '',
        type = 'OTHER',
        weight = 1.0,
        maxScore
      } = req.body;

      assessments = results.map((r: any) => ({
        learnerId: r.learnerId,
        term,
        academicYear,
        learningArea,
        strand,
        subStrand,
        title,
        type,
        weight,
        maxScore,
        detailedRating: r.detailedRating,
        overallRating: r.overallRating ?? (r.detailedRating ? detailedToGeneralRating(r.detailedRating) : undefined),
        percentage: r.percentage,
        points: r.points,
        strengths: r.strengths,
        areasImprovement: r.areasImprovement,
        recommendations: r.recommendations,
        remarks: r.remarks
      }));
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payload: expected assessments[] or results[]' });
    }

    if (assessments.length === 0) {
      return res.status(400).json({ success: false, message: 'No assessments provided' });
    }

    // Validate each entry and collect any issues
    const invalid: Array<{ learnerId: string; reason: string }> = [];
    const valid: any[] = [];

    for (const a of assessments) {
      if (!a.learnerId) {
        invalid.push({ learnerId: 'unknown', reason: 'Missing learnerId' });
        continue;
      }
      if (!a.overallRating && !a.detailedRating) {
        invalid.push({ learnerId: a.learnerId, reason: 'Missing rating (overallRating or detailedRating required)' });
        continue;
      }
      valid.push(a);
    }

    const saved = await prisma.$transaction(
      valid.map((a: any) =>
        prisma.formativeAssessment.upsert({
          where: {
            learnerId_term_academicYear_learningArea_type_title: {
              learnerId: a.learnerId,
              term: a.term,
              academicYear: parseInt(a.academicYear),
              learningArea: a.learningArea,
              type: a.type ?? 'OTHER',
              title: a.title ?? ''
            }
          },
          update: {
            overallRating: a.overallRating,
            detailedRating: a.detailedRating,
            percentage: a.percentage,
            points: a.points,
            strengths: a.strengths,
            areasImprovement: a.areasImprovement,
            remarks: a.remarks ?? a.recommendations,
            weight: a.weight != null ? Number(a.weight) : undefined
          },
          create: {
            learnerId: a.learnerId,
            teacherId,
            term: a.term,
            academicYear: parseInt(a.academicYear),
            learningArea: a.learningArea,
            strand: a.strand,
            subStrand: a.subStrand,
            title: a.title ?? '',
            type: a.type ?? 'OTHER',
            weight: a.weight != null ? Number(a.weight) : 1.0,
            maxScore: a.maxScore ? Number(a.maxScore) : undefined,
            overallRating: a.overallRating,
            detailedRating: a.detailedRating,
            percentage: a.percentage,
            points: a.points,
            strengths: a.strengths,
            areasImprovement: a.areasImprovement,
            remarks: a.remarks ?? a.recommendations
          }
        })
      )
    );

    const savedMap = saved.map((s: any) => ({
      id: s.id,
      learnerId: s.learnerId,
      status: s.status ?? 'DRAFT'
    }));

    const response: any = {
      success: true,
      message: `Successfully recorded ${saved.length} assessments`,
      data: saved,
      saved: savedMap
    };

    if (invalid.length > 0) {
      response.warnings = `${invalid.length} entries were skipped due to validation errors`;
      response.skipped = invalid;
    }

    res.status(201).json(response);

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
      name,
      title,
      learningAreaId,
      learningArea,
      testType,
      term,
      academicYear,
      testDate,
      maxScore,
      totalMarks = 100,
      passMarks = 40,
      description,
      instructions,
      grade,
      stream,
      curriculum = 'CBC_AND_EXAM',
      scaleId,
      weight = 1.0,
      duration          // FIX: now persisted to DB
    } = req.body;

    const teacherId = req.user?.userId;

    const normalizedTerm = String(term || '')
      .toUpperCase()
      .replace(/\s+/g, '_') as 'TERM_1' | 'TERM_2' | 'TERM_3';

    let resolvedLearningArea = learningArea;
    if (!resolvedLearningArea && learningAreaId) {
      const areaRecord = await prisma.learningArea.findUnique({
        where: { id: learningAreaId },
        select: { name: true },
      });
      resolvedLearningArea = areaRecord?.name;
    }

    const resolvedTitle = `${resolvedLearningArea} - ${testType} - ${normalizedTerm} ${academicYear}`;
    const resolvedTotalMarks = totalMarks ?? maxScore ?? 100;

    if (!teacherId || !resolvedLearningArea || !normalizedTerm || !academicYear || !testType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    try {
      const test = await prisma.summativeTest.create({
      data: {
        title: resolvedTitle,
        learningArea: resolvedLearningArea,
        testType,
        term: normalizedTerm,
        academicYear: parseInt(academicYear),
        testDate: testDate ? new Date(testDate) : new Date(),
        totalMarks: parseInt(String(resolvedTotalMarks)),
        passMarks: parseInt(passMarks),
        description,
        instructions,
        grade,
        curriculum,
        scaleId,
        weight: parseFloat(String(weight || 1.0)),
        duration: duration ? parseInt(String(duration)) : undefined,  // FIX: persist duration
        createdBy: teacherId,
        status: 'PUBLISHED',
        published: true,
        active: true
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
    if (error.code === 'P2002') {
       return res.status(409).json({
          success: false,
          message: `A test of type ${testType} already exists for ${learningArea} in this grade for ${term} ${academicYear}.`,
          error: 'Duplicate Test Found'
       });
    }

    console.error('Error creating summative test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test',
      error: error.message
    });
  }
  } catch (error: any) {
    console.error('Error in createSummativeTest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test',
      error: error.message
    });
  }
};

/**
 * Bulk Generate Tests for multiple learning areas
 * POST /api/assessments/tests/bulk
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
      duration,
      stream,
      curriculum = 'CBC_AND_EXAM',
      weight = 1.0,
      scaleGroupId,
      title: seriesName   // User-typed series name from BulkCreateTest form
    } = req.body;

    const teacherId = req.user?.userId;

    if (!learningAreas || !Array.isArray(learningAreas) || !grade || !term || !academicYear || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required configuration'
      });
    }

    const normalizedTerm = String(term || '')
      .toUpperCase()
      .replace(/\s+/g, '_') as 'TERM_1' | 'TERM_2' | 'TERM_3';

    // Pre-fetch scales for the grade so we can match reliably
    const gradingSystems = await prisma.gradingSystem.findMany({
      where: {
        grade: grade as any,
        type: 'SUMMATIVE',
        active: true,
        archived: false,
        ...(scaleGroupId ? { scaleGroupId } : {})
      },
      select: { id: true, name: true, learningArea: true }
    });

    // Build an exact-match map (normalised lower-case) then fall back to partial
    const scaleByArea = new Map<string, string>();
    for (const sys of gradingSystems) {
      if (sys.learningArea) {
        scaleByArea.set(sys.learningArea.trim().toLowerCase(), sys.id);
      }
    }

    const createdTests = [];
    const scaleWarnings: string[] = [];
    let duplicateCount = 0;

    for (const area of learningAreas) {
      const areaKey = String(area).trim().toLowerCase();

      // FIX: prefer exact match, fall back to includes only as last resort
      let resolvedScaleId: string | undefined =
        scaleByArea.get(areaKey) ??
        gradingSystems.find(s =>
          s.learningArea && (
            s.learningArea.toLowerCase() === areaKey ||
            s.learningArea.toLowerCase().includes(areaKey) ||
            areaKey.includes(s.learningArea.toLowerCase())
          )
        )?.id;

      if (!resolvedScaleId) {
        scaleWarnings.push(`No scale found for "${area}" — test created without a scale`);
      }

      try {
        const test = await prisma.summativeTest.create({
          data: {
            title: `${area} - ${testType} - ${normalizedTerm} ${academicYear}`,
            learningArea: area,
            testType,
            term: normalizedTerm,
            academicYear: parseInt(academicYear),
            testDate: testDate ? new Date(testDate) : new Date(),
            totalMarks: parseInt(totalMarks),
            passMarks: parseInt(passMarks),
            duration: duration ? parseInt(String(duration)) : undefined,
            grade,
            curriculum,
            weight: parseFloat(String(weight || 1.0)),
            scaleId: resolvedScaleId ?? null,
            createdBy: teacherId,
            status: 'PUBLISHED',
            published: true,
            active: true
          }
        });

        createdTests.push(test);
      } catch (err: any) {
        if (err.code === 'P2002') {
           duplicateCount++;
        } else {
           throw err; // Re-throw unhandled errors
        }
      }
    }

    let resultMessage = `Successfully generated ${createdTests.length} tests.`;
    if (duplicateCount > 0) {
      resultMessage += ` Skipped ${duplicateCount} tests because they already exist for this grade and term.`;
    }

    res.status(201).json({
      success: true,
      message: resultMessage,
      data: createdTests,
      ...(scaleWarnings.length > 0 ? { warnings: scaleWarnings } : {})
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

    const whereClause: any = {
      archived: false,
      status: 'PUBLISHED',
      active: true,
    };

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
        duration: updateData.duration != null ? parseInt(String(updateData.duration)) : undefined,
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

    const normalizedTerm = String(term || '')
      .toUpperCase()
      .replace(/\s+/g, '_');

    const whereClause: any = {
      learner: {
        grade: grade as Grade,
        ...(stream ? { stream: stream as string } : {})
      },
      test: {
        academicYear: parseInt(academicYear as string),
        term: normalizedTerm,
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

    // AI pathway predictions: only run synchronously when explicitly requested
    // and the class is small (≤10 learners). For larger classes, trigger a background
    // job via a separate endpoint — never block the bulk results response.
    const isCandidateGrade = ['GRADE_7', 'GRADE_8'].includes(grade as string);
    const predictions: Record<string, any> = {};

    if (isCandidateGrade && learnerIds.length > 0 && req.query.includePredictions === 'true') {
      const CAP = 10;
      if (learnerIds.length > CAP) {
        // Signal to the frontend that predictions must be fetched separately
        (predictions as any).__tooLarge = true;
        (predictions as any).__count = learnerIds.length;
      } else {
        await Promise.all(learnerIds.slice(0, CAP).map(async (id) => {
          try {
            predictions[id] = await aiAssistantService.generatePathwayPrediction(
              id,
              normalizedTerm,
              parseInt(academicYear as string)
            );
          } catch (e) {
            console.warn(`Failed to predict pathway for learner ${id}:`, e);
          }
        }));
      }
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
      communications,
      predictions
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

    // FIX: collect skipped rows and return them in the response
    const skipped: Array<{ learnerId: string; reason: string }> = [];
    let savedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of results) {
        if (item.marksObtained === undefined || item.marksObtained === null || item.marksObtained === '') {
          skipped.push({ learnerId: item.learnerId ?? 'unknown', reason: 'Marks not provided' });
          continue;
        }

        const marks = Number(item.marksObtained);

        if (isNaN(marks)) {
          skipped.push({ learnerId: item.learnerId ?? 'unknown', reason: 'Marks are not a valid number' });
          continue;
        }

        if (marks < 0 || marks > test.totalMarks) {
          skipped.push({
            learnerId: item.learnerId ?? 'unknown',
            reason: `Marks ${marks} out of valid range 0–${test.totalMarks}`
          });
          continue;
        }

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

        savedCount++;
      }
    });

    // FIX: Re-rank positions in a separate, async-safe operation outside the
    // per-save transaction so it doesn't run on every partial update unnecessarily.
    // We trigger it unconditionally here for correctness; a background job would
    // be the production solution for large classes.
    await _rerankTestResults(testId);

    const response: any = {
      success: true,
      message: `Successfully recorded ${savedCount} of ${results.length} results`
    };

    if (skipped.length > 0) {
      response.warnings = `${skipped.length} entries were skipped due to validation errors`;
      response.skipped = skipped;
    }

    res.json(response);

  } catch (error: any) {
    console.error('Error bulk recording summative results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record results',
      error: error.message
    });
  }
};

/**
 * Re-rank all results for a test by marks descending.
 * Extracted from bulk save so it can be called independently (e.g. after deletion).
 */
async function _rerankTestResults(testId: string) {
  const allResults = await prisma.summativeResult.findMany({
    where: { testId },
    orderBy: { marksObtained: 'desc' },
    select: { id: true }
  });

  if (allResults.length === 0) return;

  await prisma.$transaction(
    allResults.map((r, index) =>
      prisma.summativeResult.update({
        where: { id: r.id },
        data: { position: index + 1, outOf: allResults.length }
      })
    )
  );
}
