import { Router } from 'express';
import { z } from 'zod';
import { FeeTypeController } from '../controllers/feeType.controller';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// [FIX 6] Added `code` (required on create) and `category` (optional, enum-validated)
// to the schema — previously both fields were accepted silently with zero validation,
// meaning empty strings or invalid categories could reach the database.
const FEE_CATEGORIES = ['ACADEMIC', 'EXTRA_CURRICULAR', 'TRANSPORT', 'BOARDING', 'OTHER'] as const;

const createFeeTypeSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Code must be uppercase letters, digits, or underscores'),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(FEE_CATEGORIES).optional().default('ACADEMIC'),
  isActive: z.boolean().optional().default(true)
});

// Update schema: code is immutable after creation so it is excluded;
// all other fields remain optional for partial updates.
const updateFeeTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(FEE_CATEGORIES).optional(),
  isActive: z.boolean().optional()
});

// ============================================
// FEE TYPE ROUTES
// ============================================

/**
 * @route   GET /api/fees/types
 * @desc    Get all fee types
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.get(
    '/',
    requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 100 }),
    asyncHandler(FeeTypeController.getAll)
);

/**
 * @route   POST /api/fees/types
 * @desc    Create fee type
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.post(
    '/',
    requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 30 }),
    validate(createFeeTypeSchema),
    auditLog('CREATE_FEE_TYPE'),
    asyncHandler(FeeTypeController.create)
);

/**
 * @route   PUT /api/fees/types/:id
 * @desc    Update fee type
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.put(
    '/:id',
    requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 30 }),
    validate(updateFeeTypeSchema),
    auditLog('UPDATE_FEE_TYPE'),
    asyncHandler(FeeTypeController.update)
);

/**
 * @route   POST /api/fees/types/seed/defaults
 * @desc    Seed default fee types for school
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
    '/seed/defaults',
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 5 }),
    auditLog('SEED_FEE_TYPES'),
    asyncHandler(FeeTypeController.seedDefaults)
);

/**
 * @route   POST /api/fees/types/seed/structures
 * @desc    Seed default fee structures for all grades and terms.
 *          Optional body: { academicYear: number } — defaults to current year.
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
    '/seed/structures',
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 5 }),
    auditLog('SEED_FEE_STRUCTURES'),
    asyncHandler(FeeTypeController.seedStructures)
);

/**
 * @route   DELETE /api/fees/types/:id
 * @desc    Delete fee type
 * @access  ACCOUNTANT, ADMIN, SUPER_ADMIN
 */
router.delete(
    '/:id',
    requireRole(['ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 10 }),
    auditLog('DELETE_FEE_TYPE'),
    asyncHandler(FeeTypeController.delete)
);

export default router;
