/**
 * Workflow Authorization Middleware
 * Enforces role-based permissions and lock checks for workflow actions
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './permissions.middleware';
import { UserRole, AssessmentStatus } from '@prisma/client';
import prisma from '../config/database';

// ============================================
// WORKFLOW PERMISSIONS
// ============================================

const WORKFLOW_PERMISSIONS: Record<string, UserRole[]> = {
  submit: ['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'],
  approve: ['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'],
  reject: ['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'],
  publish: ['ADMIN', 'HEAD_TEACHER', 'SUPER_ADMIN'],
  lock: ['ADMIN', 'SUPER_ADMIN'],
  unlock: ['ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER']
};

// ============================================
// PERMISSION CHECKERS
// ============================================

/**
 * Check if user can perform specific workflow action
 */
export const canPerformWorkflowAction = (action: keyof typeof WORKFLOW_PERMISSIONS) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const allowedRoles = WORKFLOW_PERMISSIONS[action];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Your role (${userRole}) cannot ${action} assessments. Required roles: ${allowedRoles.join(', ')}`
          }
        });
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to check permissions',
          details: error.message
        }
      });
    }
  };
};

/**
 * Check if assessment is locked
 * Prevents all modifications to locked assessments (except by admins)
 */
export const checkNotLocked = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, assessmentId, testId } = req.params;
    // Also check body for bulk endpoints where the ID is in the request body
    const entityId = id || assessmentId || testId || req.body?.testId;
    const userRole = req.user?.role;

    if (!entityId) {
      return next(); // No ID to check, let the route handler deal with it
    }

    // Determine assessment type from route
    const assessmentType = req.path.includes('formative') ? 'formative' : 'summative';

    // Get assessment
    let assessment: any;

    if (assessmentType === 'summative') {
      assessment = await prisma.summativeTest.findUnique({
        where: { id: entityId },
        select: { status: true, locked: true }
      });
    } else {
      assessment = await prisma.formativeAssessment.findUnique({
        where: { id: entityId },
        select: { status: true, locked: true }
      });
    }

    if (!assessment) {
      // Assessment doesn't exist, let route handler return 404
      return next();
    }

    // Check if locked
    if (assessment.locked || assessment.status === 'LOCKED') {
      // Allow admins and head teachers to bypass lock
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HEAD_TEACHER') {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'LOCKED',
          message: 'This assessment is locked and cannot be modified. Contact an administrator if changes are required.',
          status: assessment.status
        }
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check lock status',
        details: error.message
      }
    });
  }
};

/**
 * Check if assessment is in published or locked state
 * Prevents modifications but allows viewing
 */
export const checkNotPublishedOrLocked = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, assessmentId, testId } = req.params;
    const entityId = id || assessmentId || testId;
    const userRole = req.user?.role;

    if (!entityId) {
      return next();
    }

    // Determine assessment type
    const assessmentType = req.path.includes('formative') ? 'formative' : 'summative';

    // Get assessment status
    let assessment: any;

    if (assessmentType === 'summative') {
      assessment = await prisma.summativeTest.findUnique({
        where: { id: entityId },
        select: { status: true }
      });
    } else {
      assessment = await prisma.formativeAssessment.findUnique({
        where: { id: entityId },
        select: { status: true }
      });
    }

    if (!assessment) {
      return next();
    }

    // Check if published or locked
    const restrictedStatuses: AssessmentStatus[] = ['PUBLISHED', 'LOCKED'];

    if (restrictedStatuses.includes(assessment.status)) {
      // Allow HEAD_TEACHER and ADMIN to edit published (but not locked)
      if (assessment.status === 'PUBLISHED' &&
        (userRole === 'HEAD_TEACHER' || userRole === 'ADMIN')) {
        return next();
      }

      // Allow ADMIN and HEAD_TEACHER to edit locked
      if (assessment.status === 'LOCKED' &&
        (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HEAD_TEACHER')) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'ASSESSMENT_FINALIZED',
          message: `This assessment is ${assessment.status.toLowerCase()} and cannot be modified`,
          status: assessment.status
        }
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check assessment status',
        details: error.message
      }
    });
  }
};

/**
 * Check if user can approve their own submission
 * Prevents conflict of interest
 */
export const preventSelfApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, assessmentId, testId } = req.params;
    const entityId = id || assessmentId || testId;
    const userId = req.user?.userId;

    if (!entityId || !userId) {
      return next();
    }

    // Determine assessment type
    const assessmentType = req.path.includes('formative') ? 'formative' : 'summative';

    // Get assessment
    let assessment: any;

    if (assessmentType === 'summative') {
      assessment = await prisma.summativeTest.findUnique({
        where: { id: entityId },
        select: { submittedBy: true }
      });
    } else {
      // Formative assessments don't have submittedBy currently
      // Skip this check for formative
      return next();
    }

    if (!assessment) {
      return next();
    }

    // Check if user is trying to approve their own submission
    // Bypass for ADMIN and SUPER_ADMIN to allow self-approval of their own tests
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    if (assessment.submittedBy === userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SELF_APPROVAL_NOT_ALLOWED',
          message: 'You cannot approve your own submission. Please have another administrator review and approve this assessment.'
        }
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check submission ownership',
        details: error.message
      }
    });
  }
};

/**
 * Check if status transition is valid
 */
export const validateStatusTransition = (targetStatus: AssessmentStatus) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, assessmentId, testId } = req.params;
      const entityId = id || assessmentId || testId;

      if (!entityId) {
        return next();
      }

      // Determine assessment type
      const assessmentType = req.path.includes('formative') ? 'formative' : 'summative';

      // Get current assessment status
      let currentStatus: AssessmentStatus;

      if (assessmentType === 'summative') {
        const assessment = await prisma.summativeTest.findUnique({
          where: { id: entityId },
          select: { status: true }
        });
        if (!assessment) return next();
        currentStatus = assessment.status;
      } else {
        const assessment = await prisma.formativeAssessment.findUnique({
          where: { id: entityId },
          select: { status: true }
        });
        if (!assessment) return next();
        currentStatus = assessment.status;
      }

      // Define allowed transitions
      const allowedTransitions: Record<AssessmentStatus, AssessmentStatus[]> = {
        DRAFT: ['SUBMITTED'],
        SUBMITTED: ['APPROVED', 'DRAFT'],
        APPROVED: ['PUBLISHED'],
        PUBLISHED: ['LOCKED'],
        LOCKED: ['PUBLISHED'] // Only via unlock
      };

      const allowed = allowedTransitions[currentStatus] || [];

      if (!allowed.includes(targetStatus)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: `Cannot transition from ${currentStatus} to ${targetStatus}`,
            currentStatus,
            targetStatus,
            allowedTransitions: allowed
          }
        });
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to validate status transition',
          details: error.message
        }
      });
    }
  };
};

/**
 * Require reason for sensitive actions
 */
export const requireReason = (minLength: number = 10) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'A reason is required for this action',
          field: 'reason'
        }
      });
    }

    if (reason.length < minLength) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_TOO_SHORT',
          message: `Reason must be at least ${minLength} characters`,
          field: 'reason',
          minLength
        }
      });
    }

    next();
  };
};

// ============================================
// COMBINED MIDDLEWARE HELPERS
// ============================================

/**
 * Standard checks for any update operation
 * Checks: authenticated, not locked, proper permissions
 */
export const standardUpdateChecks = [
  // Authentication is assumed to be checked at route level
  checkNotLocked
];

/**
 * Checks for approval actions
 */
export const approvalChecks = [
  canPerformWorkflowAction('approve'),
  preventSelfApproval,
  validateStatusTransition('APPROVED')
];

/**
 * Checks for lock actions
 */
export const lockChecks = [
  canPerformWorkflowAction('lock'),
  validateStatusTransition('LOCKED')
];

/**
 * Checks for unlock actions (strict)
 */
export const unlockChecks = [
  canPerformWorkflowAction('unlock'),
  requireReason(10)
];
