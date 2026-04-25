import { Router } from 'express';
import { secondaryController } from '../controllers/secondary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/learner/:learnerId/summary', secondaryController.getLearnerSummary);
router.get('/class/:classId/rankings', secondaryController.getClassRankings);

export default router;
