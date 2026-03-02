/**
 * Workflow Controller
 * Handles HTTP requests for assessment workflow operations
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { workflowService } from '../services/workflow.service';
import { AssessmentStatus } from '@prisma/client';

// ============================================
// WORKFLOW ACTION ENDPOINTS
// ============================================

/**
 * POST /api/workflow/submit
 * Submit assessment for approval
 */
export const submitForApproval = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { assessmentId, assessmentType, comments } = req.body;

    // Validate required fields
    if (!assessmentId || !assessmentType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'assessmentId and assessmentType are required'
        }
      });
    }

    // Validate assessment type
    if (!['formative', 'summative'].includes(assessmentType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'assessmentType must be "formative" or "summative"'
        }
      });
    }

    const result = await workflowService.submitForApproval({
      assessmentId,
      assessmentType,
      userId,
      comments
    });

    res.json({
      success: true,
      message: 'Assessment submitted for approval successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error submitting for approval:', error);

    if (error.message.includes('Cannot submit')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_ERROR',
        message: 'Failed to submit assessment for approval',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/bulk-submit
 * Bulk submit assessments for approval
 */
export const bulkSubmitForApproval = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { ids, assessmentType, comments } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ids array is required'
        }
      });
    }

    if (!assessmentType || !['formative', 'summative'].includes(assessmentType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid assessmentType (formative/summative) is required'
        }
      });
    }

    const result = await workflowService.submitAssessmentsBulk({
      ids,
      assessmentType,
      userId,
      comments
    });

    res.json({
      success: true,
      message: `Processed ${result.submitted} submissions`,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk submitting assessments:', error);

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_SUBMIT_ERROR',
        message: 'Failed to bulk submit assessments',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/approve/:type/:id
 * Approve assessment
 */
export const approveAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { type, id } = req.params;
    const { comments } = req.body;

    const result = await workflowService.approveAssessment({
      assessmentId: id,
      assessmentType: type as 'formative' | 'summative',
      userId,
      comments
    });

    res.json({
      success: true,
      message: 'Assessment approved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error approving assessment:', error);

    if (error.message.includes('Cannot approve')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not permitted') || error.message.includes('Cannot approve your own')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_ERROR',
        message: 'Failed to approve assessment',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/reject/:type/:id
 * Reject assessment (send back to draft)
 */
export const rejectAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { type, id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Rejection reason is required'
        }
      });
    }

    const result = await workflowService.rejectAssessment({
      assessmentId: id,
      assessmentType: type as 'formative' | 'summative',
      userId,
      reason
    });

    res.json({
      success: true,
      message: 'Assessment rejected and sent back to draft',
      data: result
    });
  } catch (error: any) {
    console.error('Error rejecting assessment:', error);

    if (error.message.includes('Cannot reject')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_ERROR',
        message: 'Failed to reject assessment',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/publish/:type/:id
 * Publish assessment (make visible to students/parents)
 */
export const publishAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { type, id } = req.params;
    const { comments } = req.body;

    const result = await workflowService.publishAssessment({
      assessmentId: id,
      assessmentType: type as 'formative' | 'summative',
      userId,
      comments
    });

    res.json({
      success: true,
      message: 'Assessment published successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error publishing assessment:', error);

    if (error.message.includes('Cannot publish')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'PUBLISH_ERROR',
        message: 'Failed to publish assessment',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/lock/:type/:id
 * Lock assessment (prevent all edits)
 */
export const lockAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { type, id } = req.params;
    const { reason } = req.body;

    const result = await workflowService.lockAssessment({
      assessmentId: id,
      assessmentType: type as 'formative' | 'summative',
      userId,
      reason
    });

    res.json({
      success: true,
      message: 'Assessment locked successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error locking assessment:', error);

    if (error.message.includes('Cannot lock')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'LOCK_ERROR',
        message: 'Failed to lock assessment',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/unlock/:type/:id
 * Unlock assessment (admin emergency action)
 */
export const unlockAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { type, id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Detailed reason (minimum 10 characters) required for unlocking'
        }
      });
    }

    const result = await workflowService.unlockAssessment({
      assessmentId: id,
      assessmentType: type as 'formative' | 'summative',
      userId,
      reason
    });

    res.json({
      success: true,
      message: 'Assessment unlocked successfully',
      data: result,
      warning: 'This is an emergency action. All changes will be logged.'
    });
  } catch (error: any) {
    console.error('Error unlocking assessment:', error);

    if (error.message.includes('Cannot unlock')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UNLOCK_ERROR',
        message: 'Failed to unlock assessment',
        details: error.message
      }
    });
  }
};

// ============================================
// QUERY ENDPOINTS
// ============================================

/**
 * GET /api/workflow/pending
 * Get pending approvals for current user
 */
export const getPendingApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const approvals = await workflowService.getPendingApprovals(userId);

    res.json({
      success: true,
      data: approvals
    });
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch pending approvals',
        details: error.message
      }
    });
  }
};

/**
 * GET /api/workflow/history/:type/:id
 * Get workflow history for an assessment
 */
export const getWorkflowHistory = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    if (!['formative', 'summative'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be "formative" or "summative"'
        }
      });
    }

    const history = await workflowService.getWorkflowHistory(
      id,
      type as 'formative' | 'summative'
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch workflow history',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/bulk-approve
 * Bulk approve assessments
 */
export const bulkApproveAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { ids, assessmentType, comments } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ids array is required'
        }
      });
    }

    if (!assessmentType || !['formative', 'summative'].includes(assessmentType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid assessmentType (formative/summative) is required'
        }
      });
    }

    const result = await workflowService.approveAssessmentsBulk({
      ids,
      assessmentType,
      userId,
      comments
    });

    res.json({
      success: true,
      message: `Processed ${result.approved} approvals`,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk approving assessments:', error);

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_APPROVE_ERROR',
        message: 'Failed to bulk approve assessments',
        details: error.message
      }
    });
  }
};

/**
 * POST /api/workflow/bulk-lock
 * Bulk lock all assessments for a term
 */
export const bulkLockTermAssessments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { term, academicYear, reason } = req.body;

    // Validate required fields
    if (!term || !academicYear || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'term, academicYear, and reason are required'
        }
      });
    }

    const result = await workflowService.bulkLockTermAssessments({
      term,
      academicYear: parseInt(academicYear),
      userId,
      reason
    });

    res.json({
      success: true,
      message: `Successfully locked ${result.locked} assessments`,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk locking assessments:', error);

    if (error.message.includes('not permitted')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_LOCK_ERROR',
        message: 'Failed to bulk lock assessments',
        details: error.message
      }
    });
  }
};

// ============================================
// EXPORT CONTROLLER
// ============================================

export const workflowController = {
  submitForApproval,
  bulkSubmitForApproval,
  approveAssessment,
  rejectAssessment,
  publishAssessment,
  lockAssessment,
  unlockAssessment,
  getPendingApprovals,
  getWorkflowHistory,
  bulkLockTermAssessments,
  bulkApproveAssessments
};
