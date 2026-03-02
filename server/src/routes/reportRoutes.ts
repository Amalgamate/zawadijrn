/**
 * Report Routes
 * Routes for comprehensive assessment reports and analytics
 */

import express from 'express';
import { z } from 'zod';
import { reportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditLog } from '../middleware/permissions.middleware';

const router = express.Router();

// Validation Schemas
const generatePdfSchema = z.object({
  html: z.string().min(1),
  filename: z.string().min(1).max(255),
  format: z.enum(['A4', 'LETTER']).optional(),
  margin: z.object({
    top: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
    right: z.number().optional(),
  }).optional(),
});

// ============================================
// FORMATIVE REPORT
// ============================================

/**
 * Get comprehensive formative report for a learner
 * GET /api/reports/formative/:learnerId?term=TERM_1&academicYear=2026
 */
router.get(
  '/formative/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  reportController.getFormativeReport
);

// ============================================
// SUMMATIVE REPORT
// ============================================

/**
 * Get comprehensive summative report for a learner
 * GET /api/reports/summative/:learnerId?term=TERM_1&academicYear=2026
 */
router.get(
  '/summative/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  reportController.getSummativeReport
);

// ============================================
// TERMLY REPORT (COMPREHENSIVE)
// ============================================

/**
 * Get complete termly report combining all assessments
 * GET /api/reports/termly/:learnerId?term=TERM_1&academicYear=2026
 */
router.get(
  '/termly/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  reportController.getTermlyReport
);

// ============================================
// ANALYTICS
// ============================================

/**
 * Get class-level performance analytics
 * GET /api/reports/analytics/class/:classId?term=TERM_1&academicYear=2026
 */
router.get(
  '/analytics/class/:classId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  reportController.getClassAnalytics
);

/**
 * Get individual learner analytics (year-long progress)
 * GET /api/reports/analytics/learner/:learnerId?academicYear=2026
 */
router.get(
  '/analytics/learner/:learnerId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  reportController.getLearnerAnalytics
);

// ============================================
// PDF EXPORT
// ============================================

/**
 * Generate high-fidelity PDF from HTML
 * POST /api/reports/generate-pdf
 */
router.post(
  '/generate-pdf',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(generatePdfSchema),
  auditLog('GENERATE_PDF_REPORT'),
  reportController.generatePdf
);

export default router;
