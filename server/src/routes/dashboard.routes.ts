import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { asyncHandler } from '../utils/async.util';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes are protected
router.use(authenticate);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard metrics
 * @access  ADMIN, SUPER_ADMIN
 */
router.get(
  '/admin',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 60 }),
  asyncHandler(dashboardController.getAdminMetrics.bind(dashboardController))
);

/**
 * @route   GET /api/dashboard/teacher
 * @desc    Get teacher dashboard metrics
 * @access  TEACHER
 */
router.get(
  '/teacher',
  requireRole(['TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(dashboardController.getTeacherMetrics.bind(dashboardController))
);

/**
 * @route   GET /api/dashboard/parent
 * @desc    Get parent dashboard metrics
 * @access  PARENT
 */
router.get(
  '/parent',
  requireRole(['PARENT']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(dashboardController.getParentMetrics.bind(dashboardController))
);

export default router;
