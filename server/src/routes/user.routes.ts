/**
 * User Routes
 * Handles user management endpoints with role-based access control
 * 
 * @module routes/user.routes
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requirePermission, requireRole, auditLog } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { idSchema, createUserSchema, updateUserSchema } from '../utils/validation.util';

const router = Router();
const userController = new UserController();

/**
 * @route   GET /api/users
 * @desc    Get all users (with role-based filtering)
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.get(
  '/',
  authenticate,
  requirePermission('VIEW_ALL_USERS'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(userController.getAllUsers)
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics for dashboard
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.get(
  '/stats',
  authenticate,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(userController.getUserStats)
);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by specific role
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER (limited)
 */
router.get(
  '/role/:role',
  authenticate,
  requirePermission('VIEW_ALL_USERS'),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(userController.getUsersByRole)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  SUPER_ADMIN, ADMIN, or self
 */
router.get(
  '/:id',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(userController.getUserById)
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Role-specific (SUPER_ADMIN can create any, ADMIN limited)
 */
router.post(
  '/',
  authenticate,
  requirePermission('EDIT_USER'), // Standardize creation permission if needed, but usually linked to EDIT_USER in this system
  validate(createUserSchema),
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }), // Strict: 10 users per 15 mins
  auditLog('CREATE_USER'),
  asyncHandler(userController.createUser)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  SUPER_ADMIN, ADMIN, or self (limited fields)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('EDIT_USER'),
  validate(updateUserSchema),
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 30 }), // Strict: 30 updates per 15 mins
  auditLog('UPDATE_USER'),
  asyncHandler(userController.updateUser)
);

/**
 * @route   POST /api/users/:id/archive
 * @desc    Archive user (soft delete)
 * @access  TEACHER (parents only), ADMIN, SUPER_ADMIN
 */
router.post(
  '/:id/archive',
  authenticate,
  requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER']),
  auditLog('ARCHIVE_USER'),
  asyncHandler(userController.archiveUser)
);

/**
 * @route   POST /api/users/:id/unarchive
 * @desc    Unarchive user
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/:id/unarchive',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  auditLog('UNARCHIVE_USER'),
  asyncHandler(userController.unarchiveUser)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (hard delete)
 * @access  SUPER_ADMIN, ADMIN (cannot delete self or higher roles)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('DELETE_USER'),
  auditLog('DELETE_USER'),
  asyncHandler(userController.deleteUser)
);

/**
 * @route   POST /api/users/:id/photo
 * @desc    Upload or update user profile picture
 * @access  SUPER_ADMIN, ADMIN, or self
 */
router.post(
  '/:id/photo',
  authenticate,
  auditLog('UPLOAD_USER_PHOTO'),
  asyncHandler(userController.uploadProfilePicture)
);

router.post(
  '/:id/reset-password',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  auditLog('RESET_PASSWORD'),
  asyncHandler(userController.resetPassword)
);

/**
 * @route   POST /api/users/:id/credentials
 * @desc    Send login credentials (SMS + WhatsApp) to parent/staff
 * @access  ADMIN, TEACHER, HEAD_TEACHER
 */
router.post(
  '/:id/credentials',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'TEACHER', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }),
  auditLog('SEND_CREDENTIALS'),
  asyncHandler(userController.sendCredentials)
);

export default router;
