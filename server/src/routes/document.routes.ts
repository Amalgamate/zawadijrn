/**
 * Document Routes
 * @module routes/document.routes
 */

import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireSchoolContext } from '../middleware/school.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// All routes require authentication and school context
router.use(authenticate, requireSchoolContext);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a single document
 * @access  Private
 */
router.post(
  '/upload',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  uploadSingle,
  auditLog('UPLOAD_DOCUMENT'),
  documentController.uploadDocument.bind(documentController)
);

/**
 * @route   POST /api/documents/upload-multiple
 * @desc    Upload multiple documents
 * @access  Private
 */
router.post(
  '/upload-multiple',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  uploadMultiple,
  auditLog('UPLOAD_MULTIPLE_DOCUMENTS'),
  documentController.uploadMultipleDocuments.bind(documentController)
);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the school
 * @access  Private
 * @query   category, search, page, limit
 */
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  documentController.getDocuments.bind(documentController)
);

/**
 * @route   GET /api/documents/categories
 * @desc    Get all document categories
 * @access  Private
 */
router.get(
  '/categories',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  documentController.getCategories.bind(documentController)
);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a single document
 * @access  Private
 */
router.get(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  documentController.getDocument.bind(documentController)
);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
router.put(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPDATE_DOCUMENT'),
  documentController.updateDocument.bind(documentController)
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document
 * @access  Private
 */
router.delete(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('DELETE_DOCUMENT'),
  documentController.deleteDocument.bind(documentController)
);

export default router;
