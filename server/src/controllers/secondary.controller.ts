import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { secondaryService } from '../services/secondary.service';
import { ApiError } from '../utils/error.util';
import logger from '../utils/logger';

// Term enum values mirror Prisma schema — avoids dependency on generated client
type Term = 'TERM_1' | 'TERM_2' | 'TERM_3';

export const secondaryController = {
  /**
   * Get learner's mean grade summary
   */
  getLearnerSummary: async (req: AuthRequest, res: Response) => {
    try {
      const { learnerId } = req.params;
      const { term, academicYear } = req.query;

      if (!term || !academicYear) {
        throw new ApiError(400, 'Term and academic year are required');
      }

      const summary = await secondaryService.calculateMeanGrade(
        learnerId,
        term as Term,
        parseInt(academicYear as string)
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('[SecondaryController] Error fetching learner summary:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch learner summary',
      });
    }
  },

  /**
   * Get class rankings
   */
  getClassRankings: async (req: AuthRequest, res: Response) => {
    try {
      const { classId } = req.params;
      const { term, academicYear, refresh } = req.query;

      if (!term || !academicYear) {
        throw new ApiError(400, 'Term and academic year are required');
      }

      if (refresh === 'true') {
        await secondaryService.updateClassRankings(
          classId,
          term as Term,
          parseInt(academicYear as string)
        );
      }

      const rankings = await secondaryService.getClassRankings(
        classId,
        term as Term,
        parseInt(academicYear as string)
      );

      res.json({
        success: true,
        data: rankings,
      });
    } catch (error: any) {
      logger.error('[SecondaryController] Error fetching class rankings:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch class rankings',
      });
    }
  },
};
