import { Router } from 'express';
import { SchemeOfWorkController } from '../controllers/schemeOfWork.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();
const controller = new SchemeOfWorkController();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/schemes
 * @desc    Get all schemes of work (filtered by role/query)
 * @access  Authenticated
 */
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  controller.getAll
);

/**
 * @route   GET /api/schemes/:id
 * @desc    Get specific scheme of work
 * @access  Authenticated
 */
router.get(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  controller.getById
);

/**
 * @route   POST /api/schemes
 * @desc    Create a new scheme of work
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  auditLog('CREATE_SCHEME_OF_WORK'),
  controller.create
);

/**
 * @route   PUT /api/schemes/:id
 * @desc    Update a scheme of work (content)
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.put(
  '/:id',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  auditLog('UPDATE_SCHEME_OF_WORK'),
  controller.update
);

/**
 * @route   POST /api/schemes/:id/status
 * @desc    Change status (e.g. submit)
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/:id/status',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  auditLog('STATUS_SCHEME_OF_WORK'),
  controller.updateStatus
);

/**
 * @route   POST /api/schemes/:id/review
 * @desc    Approve/Reject scheme of work
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/:id/review',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  auditLog('REVIEW_SCHEME_OF_WORK'),
  controller.review
);

/**
 * @route   DELETE /api/schemes/:id
 * @desc    Delete a draft scheme of work
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.delete(
  '/:id',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  auditLog('DELETE_SCHEME_OF_WORK'),
  controller.delete
);

export default router;
