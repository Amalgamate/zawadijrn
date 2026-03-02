/**
 * CBC Assessment Controller
 * Handles Core Competencies, Values, and Co-Curricular Activities
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Term, DetailedRubricRating } from '@prisma/client';
import prisma from '../config/database';

// ============================================
// CORE COMPETENCIES
// ============================================

/**
 * Create or Update Core Competencies
 * POST /api/cbc/competencies
 */
export const createOrUpdateCompetencies = async (req: AuthRequest, res: Response) => {
  try {
    const {
      learnerId,
      term,
      academicYear,
      communication,
      communicationComment,
      criticalThinking,
      criticalThinkingComment,
      creativity,
      creativityComment,
      collaboration,
      collaborationComment,
      citizenship,
      citizenshipComment,
      learningToLearn,
      learningToLearnComment
    } = req.body;

    const assessedBy = req.user?.userId;

    if (!assessedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Validate required fields
    if (!learnerId || !term || !academicYear || !communication || !criticalThinking ||
      !creativity || !collaboration || !citizenship || !learningToLearn) {
      return res.status(400).json({
        success: false,
        message: 'All competency ratings are required'
      });
    }

    // Upsert (create or update)
    const competencies = await prisma.coreCompetency.upsert({
      where: {
        learnerId_term_academicYear: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear)
        }
      },
      update: {
        communication: communication as DetailedRubricRating,
        communicationComment,
        criticalThinking: criticalThinking as DetailedRubricRating,
        criticalThinkingComment,
        creativity: creativity as DetailedRubricRating,
        creativityComment,
        collaboration: collaboration as DetailedRubricRating,
        collaborationComment,
        citizenship: citizenship as DetailedRubricRating,
        citizenshipComment,
        learningToLearn: learningToLearn as DetailedRubricRating,
        learningToLearnComment,
        assessedBy
      },
      create: {
        learnerId,
        term: term as Term,
        academicYear: parseInt(academicYear),
        communication: communication as DetailedRubricRating,
        communicationComment,
        criticalThinking: criticalThinking as DetailedRubricRating,
        criticalThinkingComment,
        creativity: creativity as DetailedRubricRating,
        creativityComment,
        collaboration: collaboration as DetailedRubricRating,
        collaborationComment,
        citizenship: citizenship as DetailedRubricRating,
        citizenshipComment,
        learningToLearn: learningToLearn as DetailedRubricRating,
        learningToLearnComment,
        assessedBy
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        },
        assessor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Core competencies saved successfully',
      data: competencies
    });

  } catch (error: any) {
    console.error('Error saving core competencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save core competencies',
      error: error.message
    });
  }
};

/**
 * Get Core Competencies for a Learner
 * GET /api/cbc/competencies/:learnerId?term=TERM_1&academicYear=2026
 */
export const getCompetenciesByLearner = async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Term and academic year are required'
      });
    }

    const competencies = await prisma.coreCompetency.findUnique({
      where: {
        learnerId_term_academicYear: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear as string)
        }
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        },
        assessor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: competencies
    });

  } catch (error: any) {
    console.error('Error fetching core competencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch core competencies',
      error: error.message
    });
  }
};

// ============================================
// VALUES ASSESSMENT
// ============================================

/**
 * Create or Update Values Assessment
 * POST /api/cbc/values
 */
export const createOrUpdateValues = async (req: AuthRequest, res: Response) => {
  try {
    const {
      learnerId,
      term,
      academicYear,
      love,
      responsibility,
      respect,
      unity,
      peace,
      patriotism,
      integrity,
      comment
    } = req.body;

    const assessedBy = req.user?.userId;

    if (!assessedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Validate required fields
    if (!learnerId || !term || !academicYear || !love || !responsibility ||
      !respect || !unity || !peace || !patriotism || !integrity) {
      return res.status(400).json({
        success: false,
        message: 'All value ratings are required'
      });
    }

    // Upsert
    const values = await prisma.valuesAssessment.upsert({
      where: {
        learnerId_term_academicYear: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear)
        }
      },
      update: {
        love: love as DetailedRubricRating,
        responsibility: responsibility as DetailedRubricRating,
        respect: respect as DetailedRubricRating,
        unity: unity as DetailedRubricRating,
        peace: peace as DetailedRubricRating,
        patriotism: patriotism as DetailedRubricRating,
        integrity: integrity as DetailedRubricRating,
        comment,
        assessedBy
      },
      create: {
        learnerId,
        term: term as Term,
        academicYear: parseInt(academicYear),
        love: love as DetailedRubricRating,
        responsibility: responsibility as DetailedRubricRating,
        respect: respect as DetailedRubricRating,
        unity: unity as DetailedRubricRating,
        peace: peace as DetailedRubricRating,
        patriotism: patriotism as DetailedRubricRating,
        integrity: integrity as DetailedRubricRating,
        comment,
        assessedBy
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Values assessment saved successfully',
      data: values
    });

  } catch (error: any) {
    console.error('Error saving values assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save values assessment',
      error: error.message
    });
  }
};

/**
 * Get Values Assessment for a Learner
 * GET /api/cbc/values/:learnerId?term=TERM_1&academicYear=2026
 */
export const getValuesByLearner = async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Term and academic year are required'
      });
    }

    const values = await prisma.valuesAssessment.findUnique({
      where: {
        learnerId_term_academicYear: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear as string)
        }
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: values
    });

  } catch (error: any) {
    console.error('Error fetching values assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch values assessment',
      error: error.message
    });
  }
};

// ============================================
// CO-CURRICULAR ACTIVITIES
// ============================================

/**
 * Create Co-Curricular Activity
 * POST /api/cbc/cocurricular
 */
export const createCoCurricular = async (req: AuthRequest, res: Response) => {
  try {
    const {
      learnerId,
      term,
      academicYear,
      activityName,
      activityType,
      performance,
      achievements,
      remarks
    } = req.body;

    const recordedBy = req.user?.userId;

    if (!recordedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!learnerId || !term || !academicYear || !activityName || !activityType || !performance) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const activity = await prisma.coCurricularActivity.create({
      data: {
        learnerId,
        term: term as Term,
        academicYear: parseInt(academicYear),
        activityName,
        activityType,
        performance: performance as DetailedRubricRating,
        achievements,
        remarks,
        recordedBy
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Co-curricular activity created successfully',
      data: activity
    });

  } catch (error: any) {
    console.error('Error creating co-curricular activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create co-curricular activity',
      error: error.message
    });
  }
};

/**
 * Get Co-Curricular Activities for a Learner
 * GET /api/cbc/cocurricular/:learnerId?term=TERM_1&academicYear=2026
 */
export const getCoCurricularByLearner = async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { term, academicYear } = req.query;

    const whereClause: any = { learnerId, archived: false };

    if (term) whereClause.term = term as Term;
    if (academicYear) whereClause.academicYear = parseInt(academicYear as string);

    const activities = await prisma.coCurricularActivity.findMany({
      where: whereClause,
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        },
        recorder: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });

  } catch (error: any) {
    console.error('Error fetching co-curricular activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch co-curricular activities',
      error: error.message
    });
  }
};

/**
 * Update Co-Curricular Activity
 * PUT /api/cbc/cocurricular/:id
 */
export const updateCoCurricular = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.recordedBy;

    const activity = await prisma.coCurricularActivity.update({
      where: { id },
      data: updateData,
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Co-curricular activity updated successfully',
      data: activity
    });

  } catch (error: any) {
    console.error('Error updating co-curricular activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update co-curricular activity',
      error: error.message
    });
  }
};

/**
 * Delete Co-Curricular Activity
 * DELETE /api/cbc/cocurricular/:id
 */
export const deleteCoCurricular = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      await prisma.coCurricularActivity.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Co-curricular activity permanently deleted by Super Admin'
      });
    } else {
      await prisma.coCurricularActivity.update({
        where: { id },
        data: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: req.user?.userId
        }
      });

      res.json({
        success: true,
        message: 'Co-curricular activity archived successfully'
      });
    }

  } catch (error: any) {
    console.error('Error deleting co-curricular activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process delete request',
      error: error.message
    });
  }
};

// ============================================
// TERMLY REPORT COMMENTS
// ============================================

/**
 * Save Termly Report Comments
 * POST /api/cbc/comments
 */
export const saveReportComments = async (req: Request, res: Response) => {
  try {
    const {
      learnerId,
      term,
      academicYear,
      classTeacherComment,
      classTeacherName,
      classTeacherSignature,
      headTeacherComment,
      headTeacherName,
      headTeacherSignature,
      nextTermOpens
    } = req.body;

    if (!learnerId || !term || !academicYear || !classTeacherComment || !classTeacherName || !nextTermOpens) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const comments = await prisma.termlyReportComment.upsert({
      where: {
        learnerId_term_academicYear: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear)
        }
      },
      update: {
        classTeacherComment,
        classTeacherName,
        classTeacherSignature,
        classTeacherDate: new Date(),
        headTeacherComment,
        headTeacherName,
        headTeacherSignature,
        headTeacherDate: headTeacherComment ? new Date() : undefined,
        nextTermOpens: new Date(nextTermOpens)
      },
      create: {
        learnerId,
        term: term as Term,
        academicYear: parseInt(academicYear),
        classTeacherComment,
        classTeacherName,
        classTeacherSignature,
        classTeacherDate: new Date(),
        headTeacherComment,
        headTeacherName,
        headTeacherSignature,
        headTeacherDate: headTeacherComment ? new Date() : undefined,
        nextTermOpens: new Date(nextTermOpens)
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Report comments saved successfully',
      data: comments
    });

  } catch (error: any) {
    console.error('Error saving report comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save report comments',
      error: error.message
    });
  }
};

/**
 * Get Termly Report Comments for a Learner
 * GET /api/cbc/comments/:learnerId?term=TERM_1&academicYear=2026
 */
export const getCommentsByLearner = async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Term and academic year are required'
      });
    }

    const comments = await prisma.termlyReportComment.findUnique({
      where: {
        learnerId_term_academicYear: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear as string)
        }
      },
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: comments
    });

  } catch (error: any) {
    console.error('Error fetching report comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report comments',
      error: error.message
    });
  }
};
