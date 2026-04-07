import { Router } from 'express';
import { pathwayController } from '../controllers/pathway.controller';

const router = Router();

router.get('/', pathwayController.listPathways);
router.get('/:code/categories', pathwayController.getPathwayCategories);

router.get('/learner/:learnerId', pathwayController.getLearnerPathwayAndSubjects);
router.post('/learner/:learnerId/pathway', pathwayController.setLearnerPathway);
router.post('/learner/:learnerId/subjects', pathwayController.setLearnerSubjects);

export default router;

