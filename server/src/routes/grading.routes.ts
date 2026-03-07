import { Router } from 'express';
import { z } from 'zod';
import { gradingController } from '../controllers/grading.controller';
import * as scaleGroupController from '../controllers/scaleGroup.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// Protect all routes
router.use(authenticate);

// Validation schemas
const createScaleGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional()
});

const updateScaleGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  active: z.boolean().optional(),
  isDefault: z.boolean().optional()
});

const createGradingSystemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true)
});

const createGradingRangeSchema = z.object({
  systemId: z.string().min(1),
  minScore: z.number().min(0).max(100),
  maxScore: z.number().min(0).max(100),
  grade: z.string().min(1).max(10),
  remarks: z.string().max(500).optional()
});

// ============================================
// SCALE GROUP ROUTES
// ============================================

/**
 * @route   GET /api/grading/scale-groups
 * @desc    Get all scale groups
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/scale-groups',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  scaleGroupController.getScaleGroups
);

/**
 * @route   GET /api/grading/scale-groups/:id
 * @desc    Get scale group by ID
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/scale-groups/:id',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  scaleGroupController.getScaleGroupById
);

/**
 * @route   POST /api/grading/scale-groups
 * @desc    Create scale group
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/scale-groups',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(createScaleGroupSchema),
  auditLog('CREATE_SCALE_GROUP'),
  scaleGroupController.createScaleGroup
);

/**
 * @route   PUT /api/grading/scale-groups/:id
 * @desc    Update scale group
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.put(
  '/scale-groups/:id',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(updateScaleGroupSchema),
  auditLog('UPDATE_SCALE_GROUP'),
  scaleGroupController.updateScaleGroup
);

/**
 * @route   DELETE /api/grading/scale-groups/:id
 * @desc    Delete scale group
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.delete(
  '/scale-groups/:id',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_SCALE_GROUP'),
  scaleGroupController.deleteScaleGroup
);

/**
 * @route   POST /api/grading/scale-groups/:id/generate-grades
 * @desc    Auto-generate grades for scale group
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/scale-groups/:id/generate-grades',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('GENERATE_GRADES'),
  scaleGroupController.generateGradesForScaleGroup
);

/**
 * @route   GET /api/grading/scale-groups/:id/for-test
 * @desc    Get scale group for test
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/scale-groups/:id/for-test',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  scaleGroupController.getScaleForTest
);

// ============================================
// GRADING SYSTEM ROUTES
// ============================================

/**
 * @route   GET /api/grading/systems
 * @desc    Get all grading systems
 * @access  TEACHER, HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/systems',
  requireRole(['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  gradingController.getGradingSystems
);

/**
 * @route   POST /api/grading/system
 * @desc    Create grading system
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/system',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(createGradingSystemSchema),
  auditLog('CREATE_GRADING_SYSTEM'),
  gradingController.createGradingSystem
);

/**
 * @route   PUT /api/grading/system/:id
 * @desc    Update grading system
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.put(
  '/system/:id',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createGradingSystemSchema),
  auditLog('UPDATE_GRADING_SYSTEM'),
  gradingController.updateGradingSystem
);

/**
 * @route   DELETE /api/grading/system/:id
 * @desc    Delete grading system
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.delete(
  '/system/:id',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_GRADING_SYSTEM'),
  gradingController.deleteGradingSystem
);

// ============================================
// GRADING RANGE ROUTES
// ============================================

/**
 * @route   POST /api/grading/range
 * @desc    Create grading range
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/range',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createGradingRangeSchema),
  auditLog('CREATE_GRADING_RANGE'),
  gradingController.createGradingRange
);

/**
 * @route   PUT /api/grading/range/:id
 * @desc    Update grading range
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.put(
  '/range/:id',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createGradingRangeSchema),
  auditLog('UPDATE_GRADING_RANGE'),
  gradingController.updateGradingRange
);

/**
 * @route   DELETE /api/grading/range/:id
 * @desc    Delete grading range
 * @access  HEAD_TEACHER, ADMIN, SUPER_ADMIN
 */
router.delete(
  '/range/:id',
  requireRole(['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_GRADING_RANGE'),
  gradingController.deleteGradingRange
);

export default router;
