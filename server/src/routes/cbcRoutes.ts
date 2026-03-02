/**
 * CBC Assessment Routes
 * Routes for Core Competencies, Values, and Co-Curricular Activities
 */

import express from 'express';
import { z } from 'zod';
import * as cbcController from '../controllers/cbcController';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditLog } from '../middleware/permissions.middleware';

const router = express.Router();

// Validation Schemas
const competenciesSchema = z.object({
  learnerId: z.string().min(1),
  competencies: z.object({
    criticalThinking: z.number().min(0).max(5).optional(),
    creativity: z.number().min(0).max(5).optional(),
    communication: z.number().min(0).max(5).optional(),
    collaboration: z.number().min(0).max(5).optional(),
    citizenship: z.number().min(0).max(5).optional(),
    digitalLiteracy: z.number().min(0).max(5).optional(),
  }).optional(),
});

const valuesSchema = z.object({
  learnerId: z.string().min(1),
  values: z.object({
    respect: z.number().min(0).max(5).optional(),
    responsibility: z.number().min(0).max(5).optional(),
    integrity: z.number().min(0).max(5).optional(),
    inclusivity: z.number().min(0).max(5).optional(),
  }).optional(),
});

const coCurricularSchema = z.object({
  learnerId: z.string().min(1),
  activityName: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  duration: z.string().optional(),
});

const reportCommentsSchema = z.object({
  learnerId: z.string().min(1),
  term: z.enum(['TERM_1', 'TERM_2', 'TERM_3']),
  academicYear: z.number().int().min(2020).max(2100),
  classTeacherComments: z.string().max(2000).optional(),
  principalComments: z.string().max(2000).optional(),
});

// Core Competencies
router.post(
  '/competencies',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(competenciesSchema),
  auditLog('SAVE_COMPETENCIES'),
  cbcController.createOrUpdateCompetencies
);

router.get(
  '/competencies/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  cbcController.getCompetenciesByLearner
);

// Values Assessment
router.post(
  '/values',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(valuesSchema),
  auditLog('SAVE_VALUES'),
  cbcController.createOrUpdateValues
);

router.get(
  '/values/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  cbcController.getValuesByLearner
);

// Co-Curricular Activities
router.post(
  '/cocurricular',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(coCurricularSchema),
  auditLog('CREATE_COCURRICULAR'),
  cbcController.createCoCurricular
);

router.get(
  '/cocurricular/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  cbcController.getCoCurricularByLearner
);

router.put(
  '/cocurricular/:id',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(coCurricularSchema),
  auditLog('UPDATE_COCURRICULAR'),
  cbcController.updateCoCurricular
);

router.delete(
  '/cocurricular/:id',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_COCURRICULAR'),
  cbcController.deleteCoCurricular
);

// Termly Report Comments
router.post(
  '/comments',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(reportCommentsSchema),
  auditLog('SAVE_REPORT_COMMENTS'),
  cbcController.saveReportComments
);

router.get(
  '/comments/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  cbcController.getCommentsByLearner
);

export default router;
