import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { AdminController } from '../controllers/admin.controller';
import { asyncHandler } from '../utils/async.util';

const router = Router();
const admin = new AdminController();

router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

// System modules
router.get(
  '/modules',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.getSchoolModules.bind(admin))
);

// Communication configuration
router.get(
  '/communication',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.getSchoolCommunication.bind(admin))
);

router.put(
  '/communication',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(admin.updateSchoolCommunication.bind(admin))
);

export default router;
