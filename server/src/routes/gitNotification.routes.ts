import { Router } from 'express';
import { gitNotificationController } from '../controllers/gitNotification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

router.use(authenticate);

// Preview only — available to SUPER_ADMIN and ADMIN
router.post(
  '/preview',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  asyncHandler(gitNotificationController.preview.bind(gitNotificationController))
);

// Publish to target roles
router.post(
  '/publish',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(gitNotificationController.publish.bind(gitNotificationController))
);

// List all past GIT_UPDATE notifications
router.get(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 60 }),
  asyncHandler(gitNotificationController.list.bind(gitNotificationController))
);

export default router;
