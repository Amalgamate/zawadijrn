import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../utils/error.util';
import { recommendSeniorPathwayAndSubjects } from '../services/pathway-recommendation.service';
import { buildGrade9TransitionReadiness } from '../services/pathway-transition.service';
import { getTransitionDecisionHistory, saveTransitionDecision } from '../services/pathway-transition-decision.service';
import { Term } from '@prisma/client';

export const pathwayRecommendationController = {
  recommendForLearner: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const { term, academicYear, targetGradeLevel } = req.query as any;

    if (!term || !academicYear) throw new ApiError(400, 'term and academicYear are required');

    const result = await recommendSeniorPathwayAndSubjects({
      learnerId,
      term: term as Term,
      academicYear: parseInt(String(academicYear)),
      targetGradeLevel: (targetGradeLevel as any) || 'GRADE10',
    });

    res.json(result);
  },

  grade9TransitionReadiness: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const body = (req.body || {}) as any;

    const result = await buildGrade9TransitionReadiness(learnerId, {
      learnerInterest: body.learnerInterest,
      teacherRecommendation: body.teacherRecommendation,
      parentPreference: body.parentPreference,
      nationalExam: body.nationalExam,
      term: body.term,
      academicYear: body.academicYear,
    });

    res.json(result);
  },

  saveTransitionDecision: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const body = (req.body || {}) as any;

    if (!body.recommendedPathway) throw new ApiError(400, 'recommendedPathway is required');

    const finalApprovedPathway = body.finalApprovedPathway || null;
    const canFinalize = ['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'].includes(String(req.user?.role || ''));
    if (finalApprovedPathway && !canFinalize) {
      throw new ApiError(403, 'Only Admin/Head Teacher/Curriculum Head can finalize approved pathway');
    }

    const row = await saveTransitionDecision({
      learnerId,
      recommendedPathway: String(body.recommendedPathway),
      confidenceScore: Number(body.confidenceScore || 0),
      learnerInterest: body.learnerInterest || null,
      teacherRecommendation: body.teacherRecommendation || null,
      parentPreference: body.parentPreference || null,
      finalApprovedPathway,
      mismatchWarning: body.mismatchWarning || null,
      analysisPayload: body.analysisPayload || null,
      updatedBy: req.user?.userId || null,
    });

    res.status(201).json({ success: true, data: row });
  },

  getTransitionDecisionHistory: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const rows = await getTransitionDecisionHistory(learnerId);
    res.json({ success: true, data: rows });
  },
};
