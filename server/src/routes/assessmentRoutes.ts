/**
 * Assessment Routes
 * Routes for formative and summative assessments
 */

import express from 'express';
import { z } from 'zod';
import * as assessmentController from '../controllers/assessmentController';
import * as setupController from '../controllers/setupController';
import { authenticate } from '../middleware/auth.middleware';
import { requireSchoolContext } from '../middleware/school.middleware';
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
  title: z.string().min(1).max(255).optional(),
  name: z.string().min(1).max(255).optional(),
  grade: z.enum([
    'PLAYGROUP',
    'PP1',
    'PP2',
    'GRADE_1',
    'GRADE_2',
    'GRADE_3',
    'GRADE_4',
    'GRADE_5',
    'GRADE_6',
    'GRADE_7',
    'GRADE_8',
    'GRADE_9',
  ]).optional(),
  term: z.preprocess((value) => {
    const raw = String(value || '').toUpperCase().trim();
    if (raw === 'TERM 1') return 'TERM_1';
    if (raw === 'TERM 2') return 'TERM_2';
    if (raw === 'TERM 3') return 'TERM_3';
    return raw;
  }, z.enum(['TERM_1', 'TERM_2', 'TERM_3']).optional()),
  academicYear: z.coerce.number().int().min(2020).max(2100).optional(),
  testDate: z.string().optional(),
  totalMarks: z.coerce.number().int().min(1).max(1000).optional(),
  maxScore: z.coerce.number().int().min(1).max(1000).optional(),
  passMarks: z.coerce.number().int().min(0).max(1000).optional(),
  learningArea: z.string().min(1).optional(),
  learningAreaId: z.string().min(1).optional(),
  testType: z.string().optional(),
  description: z.string().optional(),
  stream: z.string().optional(),
  curriculum: z.string().optional(),
  scaleId: z.string().nullable().optional(),
}).refine((data) => Boolean(data.title || data.name), {
  message: 'title is required',
}).refine((data) => Boolean(data.learningArea || data.learningAreaId), {
  message: 'learningArea is required',
}).refine((data) => data.term && data.academicYear, {
  message: 'term and academicYear are required',
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
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createFormativeAssessmentSchema),
  auditLog('CREATE_FORMATIVE_ASSESSMENT'),
  assessmentController.createFormativeAssessment
);

router.post(
  '/formative/bulk',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(recordFormativeResultsSchema),
  auditLog('RECORD_FORMATIVE_BULK'),
  assessmentController.recordFormativeResultsBulk
);

router.get(
  '/formative',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getFormativeAssessments
);

router.get(
  '/formative/learner/:learnerId',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getFormativeByLearner
);

router.delete(
  '/formative/:id',
  authenticate,
  requireSchoolContext,
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
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(createSummativeTestSchema),
  auditLog('CREATE_SUMMATIVE_TEST'),
  assessmentController.createSummativeTest
);

router.post(
  '/tests/bulk',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('GENERATE_TESTS_BULK'),
  assessmentController.generateTestsBulk
);

router.get(
  '/tests',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getSummativeTests
);

router.get(
  '/tests/:id',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getSummativeTest
);

router.put(
  '/tests/:id',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPDATE_SUMMATIVE_TEST'),
  assessmentController.updateSummativeTest
);

router.delete(
  '/tests/bulk',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('DELETE_TESTS_BULK'),
  assessmentController.deleteSummativeTestsBulk
);

router.delete(
  '/tests/:id',
  authenticate,
  requireSchoolContext,
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
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(recordSummativeResultSchema),
  auditLog('RECORD_SUMMATIVE_RESULT'),
  assessmentController.recordSummativeResult
);

router.post(
  '/summative/results/bulk',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('RECORD_SUMMATIVE_BULK'),
  assessmentController.recordSummativeResultsBulk
);

router.get(
  '/summative/results/bulk',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getBulkSummativeResults
);

router.get(
  '/summative/results/learner/:learnerId',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  assessmentController.getSummativeByLearner
);

router.get(
  '/summative/results/test/:testId',
  authenticate,
  requireSchoolContext,
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
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SETUP_CREATE_SCALES'),
  setupController.bulkCreateGradingScales
);

router.post(
  '/setup/create-tests',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SETUP_CREATE_TESTS'),
  setupController.bulkCreateSummativeTests
);

router.post(
  '/setup/complete',
  authenticate,
  requireSchoolContext,
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('SETUP_COMPLETE_SCHOOL'),
  setupController.completeSchoolSetup
);

export default router;
