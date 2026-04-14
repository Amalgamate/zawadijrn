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
import { feeWaiverController } from '../controllers/feeWaiver.controller';
import { feeCommentsController } from '../controllers/feeComments.controller';

const router = Router();
const feeController = new FeeController();


// Validation schemas
const feeStructureItemSchema = z.object({
  feeTypeId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).transform((value) => String(value)),
  mandatory: z.boolean().optional()
});

const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  grade: z.string().min(1).optional(),
  term: z.string().min(1).optional(),
  academicYear: z.number().int().min(2000),
  mandatory: z.boolean().optional(),
  active: z.boolean().optional(),
  feeItems: z.array(feeStructureItemSchema).min(1)
});

const updateFeeStructureSchema = createFeeStructureSchema.partial();

const processPaymentSchema = z.object({
  invoiceId: z.string().min(1).optional(),
  learnerId: z.string().min(1).optional(),
  amount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MPESA']),
  referenceNumber: z.string().min(1).optional(), // was incorrectly named transactionId
  notes: z.string().nullable().optional()
}).superRefine((data, ctx) => {
  if (!data.invoiceId && !data.learnerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either invoiceId or learnerId must be provided'
    });
  }
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
  validate(updateFeeStructureSchema),
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
  requireRole(['SUPER_ADMIN']),
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

// ── Fee Waivers ─────────────────────────────────────────────

const createWaiverSchema = z.object({
  invoiceId: z.string().min(1),
  amountWaived: z.union([z.string(), z.number()]).transform((value) => 
    typeof value === 'string' ? parseFloat(value) : value
  ),
  reason: z.string().min(5).max(500),
  waiverCategory: z.enum(['HARDSHIP', 'DISABILITY', 'SCHOLARSHIP', 'OTHER']).optional()
});

const rejectWaiverSchema = z.object({
  rejectionReason: z.string().min(5).max(500)
});

/**
 * @route   POST /api/fees/waivers
 */
router.post(
  '/waivers',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createWaiverSchema),
  auditLog('CREATE_FEE_WAIVER'),
  asyncHandler(feeWaiverController.createWaiver.bind(feeWaiverController))
);

/**
 * @route   GET /api/fees/waivers
 */
router.get(
  '/waivers',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(feeWaiverController.listWaivers.bind(feeWaiverController))
);

/**
 * @route   GET /api/fees/waivers/:id
 */
router.get(
  '/waivers/:id',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeWaiverController.getWaiverById.bind(feeWaiverController))
);

/**
 * @route   PATCH /api/fees/waivers/:id/approve
 */
router.patch(
  '/waivers/:id/approve',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('APPROVE_FEE_WAIVER'),
  asyncHandler(feeWaiverController.approveWaiver.bind(feeWaiverController))
);

/**
 * @route   PATCH /api/fees/waivers/:id/reject
 */
router.patch(
  '/waivers/:id/reject',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(rejectWaiverSchema),
  auditLog('REJECT_FEE_WAIVER'),
  asyncHandler(feeWaiverController.rejectWaiver.bind(feeWaiverController))
);

/**
 * @route   DELETE /api/fees/waivers/:id
 */
router.delete(
  '/waivers/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_FEE_WAIVER'),
  asyncHandler(feeWaiverController.deleteWaiver.bind(feeWaiverController))
);

// ── Fee Comments & Pledges ───────────────────────────────────

/**
 * @route   GET /api/fees/invoices/:id/comments
 * @desc    Get all comments and pledges for an invoice
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.get(
  '/invoices/:id/comments',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeCommentsController.listComments.bind(feeCommentsController))
);

/**
 * @route   POST /api/fees/invoices/:id/comments
 * @desc    Add a comment / call log to an invoice
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/invoices/:id/comments',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  auditLog('ADD_FEE_COMMENT'),
  asyncHandler(feeCommentsController.addComment.bind(feeCommentsController))
);

/**
 * @route   POST /api/fees/invoices/:id/pledges
 * @desc    Record a parent pledge (promise to pay on a date)
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
  '/invoices/:id/pledges',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('RECORD_FEE_PLEDGE'),
  asyncHandler(feeCommentsController.addPledge.bind(feeCommentsController))
);

/**
 * @route   PATCH /api/fees/pledges/:pledgeId/cancel
 * @desc    Cancel a pledge
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.patch(
  '/pledges/:pledgeId/cancel',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('CANCEL_FEE_PLEDGE'),
  asyncHandler(feeCommentsController.cancelPledge.bind(feeCommentsController))
);

/**
 * @route   PATCH /api/fees/pledges/:pledgeId/fulfil
 * @desc    Manually mark a pledge as fulfilled
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.patch(
  '/pledges/:pledgeId/fulfil',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('FULFIL_FEE_PLEDGE'),
  asyncHandler(feeCommentsController.fulfilPledge.bind(feeCommentsController))
);


export default router;
