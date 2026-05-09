import { Router } from 'express';
import { appsController } from '../controllers/apps.controller';
import { requireRole } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';

const router = Router();

// All routes here are already behind authenticate (applied in routes/index.ts)

// Static routes MUST come before dynamic :slug routes to avoid pattern matching
// See: https://stackoverflow.com/questions/13310352/express-js-routing-the-path-static-files

// Any admin-level user can list apps
router.get(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  asyncHandler(appsController.listApps.bind(appsController))
);

// Enable all apps (STATIC - must come before /:slug routes)
router.patch(
  '/enable-all',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  asyncHandler(appsController.enableAllApps.bind(appsController))
);

// Audit logs (STATIC - must come before /:slug routes)
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

// Dynamic routes (these use :slug parameter and must come LAST)

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

export default router;
