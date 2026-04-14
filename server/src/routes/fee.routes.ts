/**
 * Fee Management Routes
 * Handles fee structures, invoices, payments, waivers, comments, and pledges.
 *
 * Changes vs previous version:
 *  - Added PATCH /invoices/:id/cancel (wires up the previously-dead CANCELLED status)
 *  - All waiver routes consolidated here (removed stray import block at the bottom)
 *  - Comments & Pledges routes kept after payment routes for readability
 */

import { Router } from 'express';
import { FeeController } from '../controllers/fee.controller';
import { feeWaiverController } from '../controllers/feeWaiver.controller';
import { feeCommentsController } from '../controllers/feeComments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { requireSchoolContext } from '../middleware/school.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { z } from 'zod';

import feeTypeRoutes from './feeType.routes';

const router = Router();
const feeController = new FeeController();

// ─── Validation Schemas ────────────────────────────────────────────────────

const feeStructureItemSchema = z.object({
  feeTypeId: z.string().min(1),
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  mandatory: z.boolean().optional()
});

const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  grade: z.string().optional(),
  term: z.string().optional(),
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
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MPESA', 'CARD', 'OTHER']),
  referenceNumber: z.string().min(1).nullable().optional(),
  notes: z.string().nullable().optional()
}).superRefine((data, ctx) => {
  if (!data.invoiceId && !data.learnerId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Either invoiceId or learnerId must be provided' });
  }
});

const createWaiverSchema = z.object({
  invoiceId: z.string().min(1),
  amountWaived: z.union([z.string(), z.number()]).transform((v) => typeof v === 'string' ? parseFloat(v) : v),
  reason: z.string().min(5).max(500),
  waiverCategory: z.enum(['HARDSHIP', 'DISABILITY', 'SCHOLARSHIP', 'OTHER']).optional()
});

const rejectWaiverSchema = z.object({
  rejectionReason: z.string().min(5).max(500)
});

const cancelInvoiceSchema = z.object({
  reason: z.string().max(500).optional()
});

// ─── Global Middleware ─────────────────────────────────────────────────────

router.use(authenticate, requireSchoolContext);

// ─── Fee Types ─────────────────────────────────────────────────────────────

router.use('/types', rateLimit({ windowMs: 60_000, maxRequests: 50 }), feeTypeRoutes);

// ─── Fee Structures ────────────────────────────────────────────────────────

router.get(
  '/structures',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeController.getAllFeeStructures.bind(feeController))
);

router.post(
  '/structures',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createFeeStructureSchema),
  auditLog('CREATE_FEE_STRUCTURE'),
  asyncHandler(feeController.createFeeStructure.bind(feeController))
);

router.put(
  '/structures/:id',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(updateFeeStructureSchema),
  auditLog('UPDATE_FEE_STRUCTURE'),
  asyncHandler(feeController.updateFeeStructure.bind(feeController))
);

router.delete(
  '/structures/:id',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_FEE_STRUCTURE'),
  asyncHandler(feeController.deleteFeeStructure.bind(feeController))
);

// ─── Invoices ──────────────────────────────────────────────────────────────

router.get(
  '/invoices',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeController.getAllInvoices.bind(feeController))
);

router.get(
  '/invoices/export',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('EXPORT_INVOICES'),
  asyncHandler(feeController.exportInvoices.bind(feeController))
);

router.get(
  '/invoices/learner/:learnerId',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'PARENT']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeController.getLearnerInvoices.bind(feeController))
);

router.post(
  '/invoices/learner/:learnerId/email',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('EMAIL_FEE_STATEMENT'),
  asyncHandler(feeController.emailStatement.bind(feeController))
);

router.post(
  '/invoices',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('CREATE_INVOICE'),
  asyncHandler(feeController.createInvoice.bind(feeController))
);

router.post(
  '/invoices/bulk',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('BULK_CREATE_INVOICES'),
  asyncHandler(feeController.bulkGenerateInvoices.bind(feeController))
);

/**
 * @route   PATCH /api/fees/invoices/:id/cancel
 * @desc    Cancel an invoice (sets status → CANCELLED). Admin/Super Admin only.
 *          Cannot cancel an invoice with existing payments.
 *          Wires up the previously-unused CANCELLED PaymentStatus enum value.
 */
router.patch(
  '/invoices/:id/cancel',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(cancelInvoiceSchema),
  auditLog('CANCEL_INVOICE'),
  asyncHandler(feeController.cancelInvoice.bind(feeController))
);

router.delete(
  '/invoices/reset',
  requireRole(['SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('RESET_INVOICES'),
  asyncHandler(feeController.resetInvoices.bind(feeController))
);

router.post(
  '/invoices/:id/remind',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(feeController.sendInvoiceReminder.bind(feeController))
);

router.post(
  '/invoices/remind/bulk',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(feeController.bulkSendReminders.bind(feeController))
);

// ─── Comments & Pledges ────────────────────────────────────────────────────

router.get(
  '/invoices/:id/comments',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeCommentsController.listComments.bind(feeCommentsController))
);

router.post(
  '/invoices/:id/comments',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  auditLog('ADD_FEE_COMMENT'),
  asyncHandler(feeCommentsController.addComment.bind(feeCommentsController))
);

router.post(
  '/invoices/:id/pledges',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('RECORD_FEE_PLEDGE'),
  asyncHandler(feeCommentsController.addPledge.bind(feeCommentsController))
);

router.patch(
  '/pledges/:pledgeId/cancel',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('CANCEL_FEE_PLEDGE'),
  asyncHandler(feeCommentsController.cancelPledge.bind(feeCommentsController))
);

router.patch(
  '/pledges/:pledgeId/fulfil',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('FULFIL_FEE_PLEDGE'),
  asyncHandler(feeCommentsController.fulfilPledge.bind(feeCommentsController))
);

// ─── Payments ──────────────────────────────────────────────────────────────

router.post(
  '/payments',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(processPaymentSchema),
  auditLog('RECORD_PAYMENT'),
  asyncHandler(feeController.recordPayment.bind(feeController))
);

// ─── Stats ─────────────────────────────────────────────────────────────────

router.patch(
  '/payments/:id/reverse',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('REVERSE_PAYMENT'),
  asyncHandler(feeController.reversePayment.bind(feeController))
);

router.get(
  '/stats',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(feeController.getPaymentStats.bind(feeController))
);

// ─── Fee Waivers ───────────────────────────────────────────────────────────

router.post(
  '/waivers',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createWaiverSchema),
  auditLog('CREATE_FEE_WAIVER'),
  asyncHandler(feeWaiverController.createWaiver.bind(feeWaiverController))
);

router.get(
  '/waivers',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(feeWaiverController.listWaivers.bind(feeWaiverController))
);

router.get(
  '/waivers/:id',
  requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(feeWaiverController.getWaiverById.bind(feeWaiverController))
);

router.patch(
  '/waivers/:id/approve',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('APPROVE_FEE_WAIVER'),
  asyncHandler(feeWaiverController.approveWaiver.bind(feeWaiverController))
);

router.patch(
  '/waivers/:id/reject',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(rejectWaiverSchema),
  auditLog('REJECT_FEE_WAIVER'),
  asyncHandler(feeWaiverController.rejectWaiver.bind(feeWaiverController))
);

router.delete(
  '/waivers/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_FEE_WAIVER'),
  asyncHandler(feeWaiverController.deleteWaiver.bind(feeWaiverController))
);

export default router;
