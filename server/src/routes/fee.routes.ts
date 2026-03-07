/**
 * Fee Management Routes
 * Handles fee structures, invoices, and payments
 */

import { Router } from 'express';
import { FeeController } from '../controllers/fee.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { requireSchoolContext } from '../middleware/school.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { z } from 'zod';

import feeTypeRoutes from './feeType.routes';

const router = Router();
const feeController = new FeeController();

// Validation schemas
const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(100),
  grade: z.enum(['Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6']),
  amount: z.number().min(0),
  dueDate: z.string().datetime().optional()
});

const processPaymentSchema = z.object({
  learnerId: z.string().min(1),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MPESA']),
  transactionId: z.string().min(1).optional()
});

router.use(authenticate, requireSchoolContext);

// ============================================
// FEE TYPE ROUTES
// ============================================
router.use('/types', rateLimit({ windowMs: 60_000, maxRequests: 50 }), feeTypeRoutes);

// ============================================
// FEE STRUCTURE ROUTES
// ============================================

/**
 * @route   GET /api/fees/structures
 * @desc    Get all fee structures
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.get(
  '/structures',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeController.getAllFeeStructures)
);

/**
 * @route   POST /api/fees/structures
 * @desc    Create fee structure
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/structures',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createFeeStructureSchema),
  auditLog('CREATE_FEE_STRUCTURE'),
  asyncHandler(feeController.createFeeStructure)
);

/**
 * @route   PUT /api/fees/structures/:id
 * @desc    Update fee structure
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.put(
  '/structures/:id',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createFeeStructureSchema),
  auditLog('UPDATE_FEE_STRUCTURE'),
  asyncHandler(feeController.updateFeeStructure)
);

/**
 * @route   DELETE /api/fees/structures/:id
 * @desc    Delete fee structure
 * @access  ADMIN, SUPER_ADMIN
 */
router.delete(
  '/structures/:id',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_FEE_STRUCTURE'),
  asyncHandler(feeController.deleteFeeStructure)
);

// ============================================
// INVOICE ROUTES
// ============================================

/**
 * @route   GET /api/fees/invoices
 * @desc    Get all invoices (with filters)
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.get(
  '/invoices',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeController.getAllInvoices)
);

/**
 * @route   GET /api/fees/invoices/export
 * @desc    Export invoices to CSV
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.get(
  '/invoices/export',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('EXPORT_INVOICES'),
  asyncHandler(feeController.exportInvoices)
);

/**
 * @route   GET /api/fees/invoices/learner/:learnerId
 * @desc    Get invoices for specific learner
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN, PARENT (own child)
 */
router.get(
  '/invoices/learner/:learnerId',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'PARENT']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeController.getLearnerInvoices)
);

/**
 * @route   POST /api/fees/invoices/learner/:learnerId/email
 * @desc    Email statement to parent/guardian
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/invoices/learner/:learnerId/email',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('EMAIL_FEE_STATEMENT'),
  asyncHandler(feeController.emailStatement)
);

/**
 * @route   POST /api/fees/invoices
 * @desc    Create invoice
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/invoices',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('CREATE_INVOICE'),
  asyncHandler(feeController.createInvoice)
);

/**
 * @route   POST /api/fees/invoices/bulk
 * @desc    Bulk generate invoices for class/grade
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/invoices/bulk',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('BULK_CREATE_INVOICES'),
  asyncHandler(feeController.bulkGenerateInvoices)
);

/**
 * @route   DELETE /api/fees/invoices/reset
 * @desc    Delete ALL invoices and payments (Reset)
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.delete(
  '/invoices/reset',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('RESET_INVOICES'),
  asyncHandler(feeController.resetInvoices.bind(feeController))
);

/**
 * @route   POST /api/fees/invoices/:id/remind
 * @desc    Send invoice reminder
 */
router.post(
  '/invoices/:id/remind',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(feeController.sendInvoiceReminder)
);

/**
 * @route   POST /api/fees/invoices/remind/bulk
 * @desc    Bulk send reminders
 */
router.post(
  '/invoices/remind/bulk',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(feeController.bulkSendReminders)
);

// ============================================
// PAYMENT ROUTES
// ============================================

/**
 * @route   POST /api/fees/payments
 * @desc    Record payment
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/payments',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(processPaymentSchema),
  auditLog('RECORD_PAYMENT'),
  asyncHandler(feeController.recordPayment)
);

/**
 * @route   GET /api/fees/stats
 * @desc    Get payment statistics
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.get(
  '/stats',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(feeController.getPaymentStats)
);

export default router;
