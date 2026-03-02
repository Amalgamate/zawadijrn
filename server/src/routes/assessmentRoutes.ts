/**
 * Assessment Routes
 * Routes for formative and summative assessments
 */

import express from 'express';
import { z } from 'zod';
import * as assessmentController from '../controllers/assessmentController';
import * as setupController from '../controllers/setupController';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditLog } from '../middleware/permissions.middleware';

const router = express.Router();

// Validation Schemas
const createFormativeAssessmentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  date: z.string().datetime(),
  classId: z.string().min(1),
  learningAreaId: z.string().min(1),
  maxScore: z.number().int().min(1).max(1000),
});

const recordFormativeResultsSchema = z.object({
  assessmentId: z.string().min(1),
  results: z.array(z.object({
    learnerId: z.string().min(1),
    score: z.number().min(0),
  })).min(1),
});

const createSummativeTestSchema = z.object({
  name: z.string().min(1).max(255),
  grade: z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6']),
  term: z.enum(['TERM_1', 'TERM_2', 'TERM_3']),
  academicYear: z.number().int().min(2020).max(2100),
  maxScore: z.number().int().min(1).max(1000),
  learningAreaId: z.string().min(1),
});

const recordSummativeResultSchema = z.object({
  testId: z.string().min(1),
  learnerId: z.string().min(1),
  score: z.number().min(0),
  remarks: z.string().max(500).optional(),
});

// ============================================
// FORMATIVE ASSESSMENT ROUTES
// ============================================

router.post(
  '/formative',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createFormativeAssessmentSchema),
  auditLog('CREATE_FORMATIVE_ASSESSMENT'),
  assessmentController.createFormativeAssessment
);

router.post(
  '/formative/bulk',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(recordFormativeResultsSchema),
  auditLog('RECORD_FORMATIVE_BULK'),
  assessmentController.recordFormativeResultsBulk
);

router.get(
  '/formative',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getFormativeAssessments
);

router.get(
  '/formative/learner/:learnerId',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getFormativeByLearner
);

router.delete(
  '/formative/:id',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_FORMATIVE_ASSESSMENT'),
  assessmentController.deleteFormativeAssessment
);

// ============================================
// SUMMATIVE TEST ROUTES
// ============================================

router.post(
  '/tests',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(createSummativeTestSchema),
  auditLog('CREATE_SUMMATIVE_TEST'),
  assessmentController.createSummativeTest
);

router.post(
  '/tests/bulk',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('GENERATE_TESTS_BULK'),
  assessmentController.generateTestsBulk
);

router.get(
  '/tests',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getSummativeTests
);

router.get(
  '/tests/:id',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getSummativeTest
);

router.put(
  '/tests/:id',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPDATE_SUMMATIVE_TEST'),
  assessmentController.updateSummativeTest
);

router.delete(
  '/tests/bulk',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('DELETE_TESTS_BULK'),
  assessmentController.deleteSummativeTestsBulk
);

router.delete(
  '/tests/:id',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_SUMMATIVE_TEST'),
  assessmentController.deleteSummativeTest
);



// ============================================
// SUMMATIVE RESULT ROUTES
// ============================================

router.post(
  '/summative/results',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(recordSummativeResultSchema),
  auditLog('RECORD_SUMMATIVE_RESULT'),
  assessmentController.recordSummativeResult
);

router.post(
  '/summative/results/bulk',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('RECORD_SUMMATIVE_BULK'),
  assessmentController.recordSummativeResultsBulk
);

router.get(
  '/summative/results/bulk',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getBulkSummativeResults
);

router.get(
  '/summative/results/learner/:learnerId',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getSummativeByLearner
);

router.get(
  '/summative/results/test/:testId',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getTestResults
);

// ============================================
// SCHOOL SETUP ROUTES - BULK OPERATIONS
// ============================================
// These endpoints help administrators quickly set up grading scales and tests for the entire school
// WARNING: These are powerful operations that should only be available to admins/principals

router.post(
  '/setup/create-scales',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SETUP_CREATE_SCALES'),
  setupController.bulkCreateGradingScales
);

router.post(
  '/setup/create-tests',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SETUP_CREATE_TESTS'),
  setupController.bulkCreateSummativeTests
);

router.post(
  '/setup/complete',
  authenticate,
  requireTenant,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SETUP_COMPLETE_SCHOOL'),
  setupController.completeSchoolSetup
);

export default router;
