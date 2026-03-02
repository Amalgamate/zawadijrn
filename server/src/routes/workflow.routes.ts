/**
 * Workflow Routes
 * API routes for assessment workflow operations
 */

import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import {
  canPerformWorkflowAction,
  preventSelfApproval,
  requireReason,
  approvalChecks,
  lockChecks,
  unlockChecks
} from '../middleware/workflow.authorization';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// WORKFLOW ACTION ROUTES
// ============================================

/**
 * POST /api/workflow/submit
 * Submit assessment for approval
 * Body: { assessmentId, assessmentType: 'formative' | 'summative', comments? }
 */
router.post(
  '/submit',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  canPerformWorkflowAction('submit'),
  auditLog('SUBMIT_ASSESSMENT_FOR_APPROVAL'),
  workflowController.submitForApproval
);

router.post(
  '/bulk-submit',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  canPerformWorkflowAction('submit'),
  auditLog('BULK_SUBMIT_ASSESSMENTS'),
  workflowController.bulkSubmitForApproval
);

/**
 * POST /api/workflow/approve/:type/:id
 * Approve assessment
 * Body: { comments? }
 * Params: type = 'formative' | 'summative', id = assessmentId
 */
router.post(
  '/approve/:type/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  canPerformWorkflowAction('approve'),
  preventSelfApproval,
  auditLog('APPROVE_ASSESSMENT'),
  workflowController.approveAssessment
);

/**
 * POST /api/workflow/reject/:type/:id
 * Reject assessment and send back to draft
 * Body: { reason: string } (required)
 * Params: type = 'formative' | 'summative', id = assessmentId
 */
router.post(
  '/reject/:type/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  canPerformWorkflowAction('reject'),
  requireReason(10),
  auditLog('REJECT_ASSESSMENT'),
  workflowController.rejectAssessment
);

/**
 * POST /api/workflow/publish/:type/:id
 * Publish assessment (make visible to students/parents)
 * Body: { comments? }
 * Params: type = 'formative' | 'summative', id = assessmentId
 */
router.post(
  '/publish/:type/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  canPerformWorkflowAction('publish'),
  auditLog('PUBLISH_ASSESSMENT'),
  workflowController.publishAssessment
);

/**
 * POST /api/workflow/lock/:type/:id
 * Lock assessment (prevent all edits)
 * Body: { reason? }
 * Params: type = 'formative' | 'summative', id = assessmentId
 */
router.post(
  '/lock/:type/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  ...lockChecks,
  auditLog('LOCK_ASSESSMENT'),
  workflowController.lockAssessment
);

/**
 * POST /api/workflow/unlock/:type/:id
 * Unlock assessment (admin emergency action)
 * Body: { reason: string } (required, min 10 chars)
 * Params: type = 'formative' | 'summative', id = assessmentId
 */
router.post(
  '/unlock/:type/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  ...unlockChecks,
  auditLog('UNLOCK_ASSESSMENT'),
  workflowController.unlockAssessment
);

// ============================================
// QUERY ROUTES
// ============================================

/**
 * GET /api/workflow/pending
 * Get pending approvals for current user
 * Only shows assessments that the user can approve based on their role
 */
router.get(
  '/pending',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  workflowController.getPendingApprovals
);

/**
 * GET /api/workflow/history/:type/:id
 * Get workflow history for an assessment
 * Shows all status changes with timestamps and actors
 * Params: type = 'formative' | 'summative', id = assessmentId
 */
router.get(
  '/history/:type/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  workflowController.getWorkflowHistory
);

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * POST /api/workflow/bulk-lock
 * Bulk lock all published assessments for a term
 * Body: { schoolId, term, academicYear, reason }
 * Requires ADMIN role
 */
router.post(
  '/bulk-lock',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  canPerformWorkflowAction('lock'),
  requireReason(20),
  auditLog('BULK_LOCK_TERM_ASSESSMENTS'),
  workflowController.bulkLockTermAssessments
);

/**
 * POST /api/workflow/bulk-approve
 * Bulk approve assessments
 * Body: { ids, assessmentType, comments }
 * Requires appropriate role
 */
router.post(
  '/bulk-approve',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  canPerformWorkflowAction('approve'),
  auditLog('BULK_APPROVE_ASSESSMENTS'),
  workflowController.bulkApproveAssessments
);

export default router;
