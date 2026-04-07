/**
 * Learner Routes
 * Handles learner management endpoints for single-tenancy
 */

import express, { Router } from 'express';
import { LearnerController } from '../controllers/learner.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requirePermission, requireRole, ResourceAccessControl, auditLog } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { z } from 'zod';
import { getNextAdmissionNumberPreview } from '../services/admissionNumber.service';

const router = Router();
const learnerController = new LearnerController();

// Define validation schemas for learner operations
const createLearnerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  // auto-generated in controller if empty/missing
  admissionNumber: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  grade: z.string(),
  // only required when guardian is the primary contact
  guardianName: z.string().max(100).optional().or(z.literal(''))
}).passthrough();

const updateLearnerSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().optional(),
  // Match create: empty string is valid when father/mother is primary (guardian fields unused)
  guardianName: z.string().max(100).optional().or(z.literal(''))
}).passthrough();

// Protect all routes
router.use(authenticate);

router.get('/next-admission-number',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(async (_req, res) => {
    const year = new Date().getFullYear();
    const preview = await getNextAdmissionNumberPreview('MC', year);
    res.json({ success: true, data: { nextAdmissionNumber: preview || `ADM-${year}-001` } });
  })
);

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
  ResourceAccessControl.canAccessLearner(),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(learnerController.getLearnerById.bind(learnerController))
);

router.post('/', 
  requirePermission('CREATE_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  express.json({ limit: '10mb' }),  // new learner may include base64 photo
  validate(createLearnerSchema),
  auditLog('CREATE_LEARNER'), 
  asyncHandler(learnerController.createLearner.bind(learnerController))
);

router.put('/:id', 
  requirePermission('EDIT_LEARNER'), 
  ResourceAccessControl.canAccessLearner(),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  express.json({ limit: '10mb' }),  // learner record may include base64 photo
  validate(updateLearnerSchema),
  auditLog('UPDATE_LEARNER'), 
  asyncHandler(learnerController.updateLearner.bind(learnerController))
);

router.delete('/:id', 
  requirePermission('DELETE_LEARNER'), 
  ResourceAccessControl.canAccessLearner(),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_LEARNER'), 
  asyncHandler(learnerController.deleteLearner.bind(learnerController))
);

router.post('/:id/photo', 
  requirePermission('EDIT_LEARNER'), 
  ResourceAccessControl.canAccessLearner(),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  express.json({ limit: '10mb' }),  // base64 photo upload
  auditLog('UPLOAD_LEARNER_PHOTO'), 
  asyncHandler(learnerController.uploadLearnerPhoto.bind(learnerController))
);

router.delete('/:id/photo', 
  requirePermission('EDIT_LEARNER'), 
  ResourceAccessControl.canAccessLearner(),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('DELETE_LEARNER_PHOTO'), 
  asyncHandler(learnerController.deleteLearnerPhoto.bind(learnerController))
);

router.post('/bulk-promote', 
  requirePermission('PROMOTE_LEARNER'), 
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('BULK_PROMOTE_LEARNERS'), 
  asyncHandler(learnerController.promoteLearners.bind(learnerController))
);

export default router;
