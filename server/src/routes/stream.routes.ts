/**
 * Stream Routes
 * Facility Management - Stream Management Endpoints
 * Base path: /api/facility/streams
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { StreamController } from '../controllers/stream.controller';

const router = Router();
const controller = new StreamController();

// Validation schemas
const createStreamSchema = z.object({
  name: z.string().min(2).max(100)
});

const updateStreamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  active: z.boolean().optional()
});

/**
 * @route   GET /api/facility/streams
 * @desc    Get all streams
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.get(
  '/',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler((req, res) => controller.getStreams(req, res))
);

/**
 * @route   GET /api/facility/streams/:streamId
 * @desc    Get single stream by ID
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.get(
  '/:streamId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler((req, res) => controller.getStream(req, res))
);

/**
 * @route   GET /api/facility/streams/available-names
 * @desc    Get available stream names
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.get(
  '/available-names',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler((req, res) => controller.getAvailableStreamNames(req, res))
);

/**
 * @route   POST /api/facility/streams
 * @desc    Create new stream
 * @access  SUPER_ADMIN, ADMIN
 * @body    { name: string }
 */
router.post(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createStreamSchema),
  auditLog('CREATE_STREAM'),
  asyncHandler((req, res) => controller.createStream(req, res))
);

/**
 * @route   PUT /api/facility/streams/:streamId
 * @desc    Update stream
 * @access  SUPER_ADMIN, ADMIN
 * @body    { name?: string, active?: boolean }
 */
router.put(
  '/:streamId',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(updateStreamSchema),
  auditLog('UPDATE_STREAM'),
  asyncHandler((req, res) => controller.updateStream(req, res))
);

/**
 * @route   DELETE /api/facility/streams/:streamId
 * @desc    Archive stream (soft delete)
 * @access  SUPER_ADMIN, ADMIN
 */
router.delete(
  '/:streamId',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_STREAM'),
  asyncHandler((req, res) => controller.deleteStream(req, res))
);

export default router;
