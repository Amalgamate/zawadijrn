/**
 * AI & Performance Controller
 * Exposes smart features and analytics to the frontend.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiAssistantService } from '../services/ai-assistant.service';
import { performanceService } from '../services/performance.service';
import { ApiError } from '../utils/error.util';

export const aiController = {
    /**
     * Generate AI Feedback for a learner
     */
    generateFeedback: async (req: AuthRequest, res: Response) => {
        try {
            const { learnerId } = req.params;
            const { term, academicYear } = req.query;

            if (!term || !academicYear) {
                throw new ApiError(400, 'Term and academic year are required');
            }

            const feedback = await aiAssistantService.generateTeacherFeedback(
                learnerId,
                term,
                parseInt(academicYear as string)
            );

            res.json({
                success: true,
                data: feedback
            });
        } catch (error: any) {
            console.error('AI Feedback Error:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to generate AI feedback'
            });
        }
    },

    /**
     * Analyze learner risk levels
     */
    analyzeRisk: async (req: AuthRequest, res: Response) => {
        try {
            const { learnerId } = req.params;
            const analysis = await aiAssistantService.analyzeLearnerRisk(learnerId);

            res.json({
                success: true,
                data: analysis
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to analyze learner risk'
            });
        }
    },

    /**
     * Get learner performance trend
     */
    getTrend: async (req: AuthRequest, res: Response) => {
        try {
            const { learnerId } = req.params;
            const trend = await performanceService.getLearnerPerformanceTrend(learnerId);

            res.json({
                success: true,
                data: trend
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to get learner trend'
            });
        }
    }
};
