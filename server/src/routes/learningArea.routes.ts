/**
 * Learning Area Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  getLearningAreas,
  getLearningArea,
  createLearningArea,
  updateLearningArea,
  deleteLearningArea,
  seedLearningAreas
} from '../controllers/learningArea.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// Validation schemas
const createLearningAreaSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(10).optional(),
  description: z.string().max(500).optional()
});

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/learning-areas
 * @desc    Get all learning areas
 * @access  Authenticated
 */
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getLearningAreas
);

/**
 * @route   GET /api/learning-areas/:id
 * @desc    Get specific learning area
 * @access  Authenticated
 */
router.get(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getLearningArea
);

/**
 * @route   POST /api/learning-areas
 * @desc    Create learning area
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createLearningAreaSchema),
  auditLog('CREATE_LEARNING_AREA'),
  createLearningArea
);

/**
 * @route   POST /api/learning-areas/seed/default
 * @desc    Seed default learning areas
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/seed/default',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SEED_LEARNING_AREAS'),
  seedLearningAreas
);

/**
 * @route   PUT /api/learning-areas/:id
 * @desc    Update learning area
 * @access  ADMIN, SUPER_ADMIN
 */
router.put(
  '/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createLearningAreaSchema),
  auditLog('UPDATE_LEARNING_AREA'),
  updateLearningArea
);

/**
 * @route   DELETE /api/learning-areas/:id
 * @desc    Delete learning area
 * @access  ADMIN, SUPER_ADMIN
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_LEARNING_AREA'),
  deleteLearningArea
);

export default router;
