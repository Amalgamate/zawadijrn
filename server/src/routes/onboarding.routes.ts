import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller';
import { authRateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();
const onboardingController = new OnboardingController();

// Support both paths while clients converge.
router.post('/register', authRateLimit(5, 60_000), onboardingController.registerFull.bind(onboardingController));
router.post('/register-full', authRateLimit(5, 60_000), onboardingController.registerFull.bind(onboardingController));
router.get('/verify-email', onboardingController.verifyEmail.bind(onboardingController));
router.post('/verify-phone', authRateLimit(10, 60_000), onboardingController.verifyPhone.bind(onboardingController));

export default router;
