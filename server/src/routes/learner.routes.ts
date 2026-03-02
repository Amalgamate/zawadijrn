/**
 * Learner Routes
 * Handles learner management endpoints for single-tenancy
 */

import { Router } from 'express';
import { LearnerController } from '../controllers/learner.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requirePermission, requireRole, auditLog } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { z } from 'zod';

const router = Router();
const learnerController = new LearnerController();

// Define validation schemas for learner operations
const createLearnerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  admissionNumber: z.string().min(1).max(50),
  dateOfBirth: z.string().datetime().optional(),
  grade: z.enum(['Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6']),
  guardianName: z.string().min(2).max(100).optional()
});

const updateLearnerSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  guardianName: z.string().min(2).max(100).optional()
});

// Protect all routes
router.use(authenticate);

router.get('/birthdays/upcoming', 
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(learnerController.getUpcomingBirthdays.bind(learnerController))
);

router.get('/stats', 
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']), 
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(learnerController.getLearnerStats.bind(learnerController))
);

router.get('/', 
  requirePermission('VIEW_ALL_LEARNERS'), 
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(learnerController.getAllLearners.bind(learnerController))
);

router.get('/grade/:grade', 
  requirePermission('VIEW_ALL_LEARNERS'), 
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(learnerController.getLearnersByGrade.bind(learnerController))
);

router.get('/admission/:admissionNumber', 
  requirePermission('VIEW_ALL_LEARNERS'), 
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(learnerController.getLearnerByAdmissionNumber.bind(learnerController))
);

router.get('/:id', 
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(learnerController.getLearnerById.bind(learnerController))
);

router.post('/', 
  requirePermission('CREATE_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createLearnerSchema),
  auditLog('CREATE_LEARNER'), 
  asyncHandler(learnerController.createLearner.bind(learnerController))
);

router.put('/:id', 
  requirePermission('EDIT_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(updateLearnerSchema),
  auditLog('UPDATE_LEARNER'), 
  asyncHandler(learnerController.updateLearner.bind(learnerController))
);

router.delete('/:id', 
  requirePermission('DELETE_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_LEARNER'), 
  asyncHandler(learnerController.deleteLearner.bind(learnerController))
);

router.post('/:id/photo', 
  requirePermission('EDIT_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPLOAD_LEARNER_PHOTO'), 
  asyncHandler(learnerController.uploadLearnerPhoto.bind(learnerController))
);

router.delete('/:id/photo', 
  requirePermission('EDIT_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('DELETE_LEARNER_PHOTO'), 
  asyncHandler(learnerController.deleteLearnerPhoto.bind(learnerController))
);

router.post('/bulk-promote', 
  requirePermission('EDIT_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('BULK_PROMOTE_LEARNERS'), 
  asyncHandler(learnerController.promoteLearners.bind(learnerController))
);

export default router;
