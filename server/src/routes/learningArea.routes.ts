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

// ── Validation schemas ───────────────────────────────────────────────────────

const createLearningAreaSchema = z.object({
  name: z.string().min(2).max(200),
  shortName: z.string().min(1).max(20).optional(),
  gradeLevel: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().max(500).optional(),
  // strip legacy / multi-tenant fields silently
  code: z.string().optional(),
  schoolId: z.string().optional(),
});

const updateLearningAreaSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  shortName: z.string().min(1).max(20).optional(),
  gradeLevel: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().max(500).optional(),
});

// ── Auth applied to all routes ───────────────────────────────────────────────

router.use(authenticate);

// ── GET /api/learning-areas ─────────────────────────────────────────────────
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getLearningAreas
);

// ── POST /api/learning-areas/seed/default ───────────────────────────────────
// MUST be declared before /:id routes to avoid Express treating "seed" as an id
router.post(
  '/seed/default',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SEED_LEARNING_AREAS'),
  seedLearningAreas
);

// ── POST /api/learning-areas ────────────────────────────────────────────────
router.post(
  '/',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createLearningAreaSchema),
  auditLog('CREATE_LEARNING_AREA'),
  createLearningArea
);

// ── GET /api/learning-areas/:id ─────────────────────────────────────────────
router.get(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getLearningArea
);

// ── PUT /api/learning-areas/:id ─────────────────────────────────────────────
router.put(
  '/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(updateLearningAreaSchema),
  auditLog('UPDATE_LEARNING_AREA'),
  updateLearningArea
);

// ── DELETE /api/learning-areas/:id ──────────────────────────────────────────
router.delete(
  '/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_LEARNING_AREA'),
  deleteLearningArea
);

export default router;
