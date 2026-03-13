/**
 * AI & Performance Routes
 */

import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected by default via index.ts parent mount
// But adding authenticate here for clarity if used standalone
router.use(authenticate);

// AI Assistant Routes
router.get('/feedback/:learnerId', aiController.generateFeedback);
router.get('/analyze-risk/:learnerId', aiController.analyzeRisk);

// Performance Analytics Routes
router.get('/trend/:learnerId', aiController.getTrend);

export default router;
