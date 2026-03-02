import { Router } from 'express';
import { z } from 'zod';
import { PlannerController } from '../controllers/planner.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();
const controller = new PlannerController();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  eventType: z.string().max(50).optional()
});

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/planner/events
 * @desc    Get all planner events
 * @access  Authenticated
 */
router.get(
  '/events',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  controller.getEvents
);

/**
 * @route   POST /api/planner/events
 * @desc    Create event (Admin, Head Teacher, Teacher)
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
 */
router.post(
  '/events',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(createEventSchema),
  auditLog('CREATE_PLANNER_EVENT'),
  controller.createEvent
);

/**
 * @route   PUT /api/planner/events/:id
 * @desc    Update event
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
 */
router.put(
  '/events/:id',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createEventSchema),
  auditLog('UPDATE_PLANNER_EVENT'),
  controller.updateEvent
);

/**
 * @route   DELETE /api/planner/events/:id
 * @desc    Delete event
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.delete(
  '/events/:id',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_PLANNER_EVENT'),
  controller.deleteEvent
);

export default router;
