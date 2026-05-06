import { Router } from 'express';
import { z } from 'zod';
import { DutyRosterFrequency } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { DutyRosterController } from '../controllers/dutyRoster.controller';

const router = Router();
const controller = new DutyRosterController();

const assignmentSchema = z.object({
  teacherId: z.string().uuid(),
  dutyDate: z.string().datetime({ offset: true }).or(z.string().date()),
  role: z.string().max(120).optional(),
  notes: z.string().max(500).optional()
});

const createRosterSchema = z.object({
  title: z.string().min(2).max(120),
  frequency: z.nativeEnum(DutyRosterFrequency),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
  isActive: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
  assignments: z.array(assignmentSchema).optional()
});

const updateRosterSchema = createRosterSchema.partial();

router.use(authenticate);

router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 80 }),
  controller.list
);

router.get(
  '/teachers',
  rateLimit({ windowMs: 60_000, maxRequests: 80 }),
  controller.listTeachers
);

router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createRosterSchema),
  auditLog('CREATE_DUTY_ROSTER'),
  controller.create
);

router.put(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(updateRosterSchema),
  auditLog('UPDATE_DUTY_ROSTER'),
  controller.update
);

router.delete(
  '/:id',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_DUTY_ROSTER'),
  controller.remove
);

export default router;
