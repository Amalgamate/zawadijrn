import { Router } from 'express';
import { pathwayRecommendationController } from '../controllers/pathwayRecommendation.controller';

const router = Router();

// GET /api/pathways/recommendations/:learnerId?term=TERM_1&academicYear=2026&targetGradeLevel=GRADE10
router.get('/recommendations/:learnerId', pathwayRecommendationController.recommendForLearner);
router.post('/transition/:learnerId/readiness', pathwayRecommendationController.grade9TransitionReadiness);
router.post('/transition/:learnerId/decision', pathwayRecommendationController.saveTransitionDecision);
router.get('/transition/:learnerId/decision-history', pathwayRecommendationController.getTransitionDecisionHistory);

export default router;
