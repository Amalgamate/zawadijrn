/**
 * secondary.routes.ts
 *
 * Routes for the Secondary module (Grade 10–12 / Senior Secondary).
 *
 * Guard contract:
 *   - authenticate    — applied once in index.ts before this router is mounted
 *   - requireInstitutionType('SECONDARY') — applied in index.ts at mount point
 *   - requireRole     — applied per route here; no duplicate auth guards needed
 *
 * SUPER_ADMIN is explicitly allowed alongside school-level admin roles so that
 * platform-level users can debug Secondary data without accidental bypass.
 */

import { Router } from 'express';
import { secondaryController } from '../controllers/secondary.controller';
import { requireRole } from '../middleware/permissions.middleware';

const router = Router();

// authenticate + requireInstitutionType('SECONDARY') already applied by index.ts

/**
 * @route  GET /api/secondary/learner/:learnerId/summary
 * @access SUPER_ADMIN, ADMIN, HEAD_TEACHER, HEAD_OF_CURRICULUM, TEACHER
 */
router.get(
  '/learner/:learnerId/summary',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
  secondaryController.getLearnerSummary
);

/**
 * @route  GET /api/secondary/class/:classId/rankings
 * @access SUPER_ADMIN, ADMIN, HEAD_TEACHER, HEAD_OF_CURRICULUM, TEACHER
 */
router.get(
  '/class/:classId/rankings',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
  secondaryController.getClassRankings
);

export default router;
