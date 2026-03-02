import { Router } from 'express';
import { z } from 'zod';
import inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional()
});

const createStoreSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().max(200).optional()
});

const createItemSchema = z.object({
  name: z.string().min(2).max(200),
  categoryId: z.string().min(1),
  storeId: z.string().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0).optional()
});

const recordMovementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().min(0),
  notes: z.string().max(500).optional()
});

const createRequisitionSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().min(1),
  purpose: z.string().max(500).optional()
});

const registerAssetSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().max(100),
  value: z.number().min(0),
  serialNumber: z.string().max(50).optional()
});

// ============================================
// CATEGORY ROUTES
// ============================================

/**
 * @route   POST /api/inventory/categories/:schoolId
 * @desc    Create item category
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/categories/:schoolId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createCategorySchema),
  auditLog('CREATE_INVENTORY_CATEGORY'),
  inventoryController.createCategory
);

/**
 * @route   GET /api/inventory/categories/:schoolId
 * @desc    Get item categories
 * @access  Authenticated
 */
router.get(
  '/categories/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  inventoryController.getCategories
);

// ============================================
// STORE ROUTES
// ============================================

/**
 * @route   POST /api/inventory/stores/:schoolId
 * @desc    Create store
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/stores/:schoolId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createStoreSchema),
  auditLog('CREATE_STORE'),
  inventoryController.createStore
);

/**
 * @route   GET /api/inventory/stores/:schoolId
 * @desc    Get stores
 * @access  Authenticated
 */
router.get(
  '/stores/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  inventoryController.getStores
);

// ============================================
// ITEM ROUTES
// ============================================

/**
 * @route   POST /api/inventory/items/:schoolId
 * @desc    Create inventory item
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/items/:schoolId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createItemSchema),
  auditLog('CREATE_INVENTORY_ITEM'),
  inventoryController.createItem
);

/**
 * @route   GET /api/inventory/items/:schoolId
 * @desc    Get inventory items
 * @access  Authenticated
 */
router.get(
  '/items/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  inventoryController.getItems
);

// ============================================
// STOCK MOVEMENT ROUTES
// ============================================

/**
 * @route   POST /api/inventory/movements/:schoolId
 * @desc    Record stock movement
 * @access  ADMIN, SUPER_ADMIN, LIBRARIAN
 */
router.post(
  '/movements/:schoolId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'LIBRARIAN'),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(recordMovementSchema),
  auditLog('RECORD_STOCK_MOVEMENT'),
  inventoryController.recordMovement
);

/**
 * @route   GET /api/inventory/movements/:schoolId
 * @desc    Get stock movements
 * @access  Authenticated
 */
router.get(
  '/movements/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  inventoryController.getMovements
);

// ============================================
// REQUISITION ROUTES
// ============================================

/**
 * @route   POST /api/inventory/requisitions/:schoolId
 * @desc    Create requisition
 * @access  Authenticated
 */
router.post(
  '/requisitions/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(createRequisitionSchema),
  auditLog('CREATE_REQUISITION'),
  inventoryController.createRequisition
);

/**
 * @route   GET /api/inventory/requisitions/:schoolId
 * @desc    Get requisitions
 * @access  Authenticated
 */
router.get(
  '/requisitions/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  inventoryController.getRequisitions
);

/**
 * @route   PATCH /api/inventory/requisitions/:id/status
 * @desc    Update requisition status
 * @access  ADMIN, SUPER_ADMIN
 */
router.patch(
  '/requisitions/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPDATE_REQUISITION_STATUS'),
  inventoryController.updateRequisitionStatus
);

// ============================================
// ASSET ROUTES
// ============================================

/**
 * @route   POST /api/inventory/assets/:schoolId
 * @desc    Register asset
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/assets/:schoolId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(registerAssetSchema),
  auditLog('REGISTER_ASSET'),
  inventoryController.registerAsset
);

/**
 * @route   POST /api/inventory/assets/assign
 * @desc    Assign asset to user
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/assets/assign',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('ASSIGN_ASSET'),
  inventoryController.assignAsset
);

/**
 * @route   GET /api/inventory/assets/:schoolId
 * @desc    Get asset register
 * @access  Authenticated
 */
router.get(
  '/assets/:schoolId',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  inventoryController.getAssetRegister
);

export default router;
