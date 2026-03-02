import { Router } from 'express';
import { z } from 'zod';
import { accountingController } from '../controllers/accounting.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// Validation schemas
const createJournalEntrySchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  entries: z.array(z.object({
    accountId: z.string().min(1),
    debit: z.number().min(0).optional(),
    credit: z.number().min(0).optional()
  }))
});

const createVendorSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  address: z.string().max(500).optional()
});

const recordExpenseSchema = z.object({
  vendorId: z.string().min(1),
  amount: z.number().min(0),
  category: z.string().min(1),
  description: z.string().max(500).optional(),
  date: z.string().datetime()
});

// ============================================
// CHART OF ACCOUNTS & JOURNALS
// ============================================

/**
 * @route   GET /api/accounting/accounts
 * @desc    Get chart of accounts
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.get(
  '/accounts',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  accountingController.getAccounts
);

/**
 * @route   GET /api/accounting/journals
 * @desc    Get all journals
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.get(
  '/journals',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  accountingController.getJournals
);

/**
 * @route   POST /api/accounting/initialize
 * @desc    Initialize chart of accounts
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/initialize',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('INITIALIZE_CHART_OF_ACCOUNTS'),
  accountingController.initializeCoA
);

// ============================================
// JOURNAL ENTRIES
// ============================================

/**
 * @route   POST /api/accounting/entries
 * @desc    Create journal entry
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/entries',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createJournalEntrySchema),
  auditLog('CREATE_JOURNAL_ENTRY'),
  accountingController.createJournalEntry
);

/**
 * @route   PUT /api/accounting/entries/:id/post
 * @desc    Post journal entry (commit)
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.put(
  '/entries/:id/post',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('POST_JOURNAL_ENTRY'),
  accountingController.postJournalEntry
);

// ============================================
// ACCOUNTING REPORTS
// ============================================

/**
 * @route   GET /api/accounting/reports/trial-balance
 * @desc    Get trial balance report
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.get(
  '/reports/trial-balance',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  accountingController.getTrialBalance
);

// ============================================
// VENDOR & EXPENSE MANAGEMENT
// ============================================

/**
 * @route   GET /api/accounting/vendors
 * @desc    Get all vendors
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.get(
  '/vendors',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  accountingController.getVendors
);

/**
 * @route   POST /api/accounting/vendors
 * @desc    Create vendor
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/vendors',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createVendorSchema),
  auditLog('CREATE_VENDOR'),
  accountingController.createVendor
);

/**
 * @route   POST /api/accounting/expenses
 * @desc    Record expense
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/expenses',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(recordExpenseSchema),
  auditLog('RECORD_EXPENSE'),
  accountingController.recordExpense
);

// ============================================
// BANK & RECONCILIATION
// ============================================

/**
 * @route   GET /api/accounting/bank-statements
 * @desc    Get bank statements
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.get(
  '/bank-statements',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  accountingController.getBankStatements
);

/**
 * @route   POST /api/accounting/bank-statements/import
 * @desc    Import bank statement (CSV/OFX)
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/bank-statements/import',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('IMPORT_BANK_STATEMENT'),
  accountingController.importBankStatement
);

/**
 * @route   POST /api/accounting/bank-statements/reconcile
 * @desc    Reconcile bank entry
 * @access  ADMIN, SUPER_ADMIN, ACCOUNTANT
 */
router.post(
  '/bank-statements/reconcile',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('RECONCILE_BANK_ENTRY'),
  accountingController.reconcileLine
);

export default router;
