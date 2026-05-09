import { Router } from 'express';
import { requireRole } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { getSystemLogs } from '../controllers/systemLogs.controller';

const router = Router();

router.get(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  asyncHandler(getSystemLogs)
);

export default router;
