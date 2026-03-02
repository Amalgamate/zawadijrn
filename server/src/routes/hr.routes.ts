import { Router } from 'express';
import { z } from 'zod';
import { hrController } from '../controllers/hr.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// Validation schemas
const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(1000).optional()
});

const performanceSchema = z.object({
  userId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comments: z.string().max(1000).optional()
});

// ============================================
// STAFF DIRECTORY & MANAGEMENT
// ============================================

/**
 * @route   GET /api/hr/staff
 * @desc    Get staff directory
 * @access  Authenticated
 */
router.get(
  '/staff',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  hrController.getStaffDirectory
);

/**
 * @route   PUT /api/hr/staff/:userId
 * @desc    Update staff HR information
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.put(
  '/staff/:userId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPDATE_STAFF_HR'),
  hrController.updateStaffHR
);

// ============================================
// LEAVE MANAGEMENT
// ============================================

/**
 * @route   GET /api/hr/leave/types
 * @desc    Get leave types
 * @access  Authenticated
 */
router.get(
  '/leave/types',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  hrController.getLeaveTypes
);

/**
 * @route   POST /api/hr/leave/apply
 * @desc    Submit leave request
 * @access  Authenticated
 */
router.post(
  '/leave/apply',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(leaveRequestSchema),
  auditLog('SUBMIT_LEAVE_REQUEST'),
  hrController.submitLeave
);

/**
 * @route   GET /api/hr/leave/requests
 * @desc    Get leave requests
 * @access  Authenticated
 */
router.get(
  '/leave/requests',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  hrController.getLeaveRequests
);

/**
 * @route   PUT /api/hr/leave/approve/:requestId
 * @desc    Approve leave request
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.put(
  '/leave/approve/:requestId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('APPROVE_LEAVE'),
  hrController.approveLeave
);

// ============================================
// PAYROLL MANAGEMENT
// ============================================

/**
 * @route   POST /api/hr/payroll/generate
 * @desc    Generate payroll
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/payroll/generate',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('GENERATE_PAYROLL'),
  hrController.generatePayroll
);

/**
 * @route   GET /api/hr/payroll
 * @desc    Get payroll information
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.get(
  '/payroll',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  hrController.getPayroll
);

/**
 * @route   PUT /api/hr/payroll/confirm/:id
 * @desc    Confirm payroll
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.put(
  '/payroll/confirm/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('CONFIRM_PAYROLL'),
  hrController.confirmPayroll
);

// ============================================
// PERFORMANCE MANAGEMENT
// ============================================

/**
 * @route   GET /api/hr/performance
 * @desc    Get performance evaluations
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER, HEAD_OF_CURRICULUM
 */
router.get(
  '/performance',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  hrController.getPerformance
);

/**
 * @route   POST /api/hr/performance
 * @desc    Create performance evaluation
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.post(
  '/performance',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(performanceSchema),
  auditLog('CREATE_PERFORMANCE_EVALUATION'),
  hrController.createPerformance
);

/**
 * @route   PUT /api/hr/performance/:id
 * @desc    Update performance evaluation
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.put(
  '/performance/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(performanceSchema),
  auditLog('UPDATE_PERFORMANCE_EVALUATION'),
  hrController.updatePerformance
);

export default router;
