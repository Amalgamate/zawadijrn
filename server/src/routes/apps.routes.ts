import { Router } from 'express';
import { appsController } from '../controllers/apps.controller';
import { requireRole } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';

const router = Router();

// All routes here are already behind authenticate (applied in routes/index.ts)

// Any admin-level user can list apps and toggle
router.get(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  asyncHandler(appsController.listApps.bind(appsController))
);

router.patch(
  '/:slug/toggle',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  asyncHandler(appsController.toggleApp.bind(appsController))
);

// Super admin only
router.patch(
  '/:slug/mandatory',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(appsController.setMandatory.bind(appsController))
);

router.patch(
  '/:slug/visibility',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(appsController.setVisibility.bind(appsController))
);

// Audit logs
router.get(
  '/audit',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(appsController.getFullAuditLog.bind(appsController))
);

router.get(
  '/audit/mine',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  asyncHandler(appsController.getMyAuditLog.bind(appsController))
);

export default router;
