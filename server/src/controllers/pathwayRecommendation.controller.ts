import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../utils/error.util';
import { recommendSeniorPathwayAndSubjects } from '../services/pathway-recommendation.service';
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
};

