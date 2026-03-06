import express from 'express';
import { z } from 'zod';
import {
  saveBroadcastCampaign,
  getBroadcastHistory,
  getBroadcastDetails,
  getBroadcastStats,
  saveSmsDeliveryLog,
  deleteBroadcastCampaign
} from '../controllers/broadcast.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireSchoolContext } from '../middleware/school.middleware';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = express.Router();

// Validation schemas
const createCampaignSchema = z.object({
  title: z.string().min(2).max(200),
  message: z.string().min(1).max(5000),
  targetAudience: z.enum(['ALL', 'CLASS', 'GRADE']).optional(),
  classId: z.string().optional(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']).optional()
});

const deliveryLogSchema = z.object({
  recipientPhone: z.string().min(10),
  status: z.enum(['SENT', 'FAILED', 'PENDING']),
  messageId: z.string().optional(),
  errorMessage: z.string().max(500).optional()
});

/**
 * Apply authentication and school context middleware to all routes
 */
router.use(authenticate);
router.use(requireSchoolContext);

/**
 * Broadcast Routes
 * Base path: /api/broadcasts
 */

/**
 * @route   POST /api/broadcasts
 * @desc    Save broadcast campaign after sending
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.post(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(createCampaignSchema),
  auditLog('CREATE_BROADCAST_CAMPAIGN'),
  saveBroadcastCampaign
);

/**
 * @route   GET /api/broadcasts
 * @desc    Get broadcast history
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.get(
  '/',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getBroadcastHistory
);

/**
 * @route   GET /api/broadcasts/stats/:schoolId
 * @desc    Get broadcast statistics
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.get(
  '/stats/:schoolId',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  getBroadcastStats
);

/**
 * @route   GET /api/broadcasts/:campaignId
 * @desc    Get broadcast campaign details
 * @access  ADMIN, SUPER_ADMIN, HEAD_TEACHER
 */
router.get(
  '/:campaignId',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getBroadcastDetails
);

/**
 * @route   POST /api/broadcasts/:campaignId/delivery-logs
 * @desc    Save SMS delivery log
 * @access  ADMIN, SUPER_ADMIN
 */
router.post(
  '/:campaignId/delivery-logs',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  validate(deliveryLogSchema),
  auditLog('LOG_DELIVERY_STATUS'),
  saveSmsDeliveryLog
);

/**
 * @route   DELETE /api/broadcasts/:campaignId
 * @desc    Delete broadcast campaign
 * @access  ADMIN, SUPER_ADMIN
 */
router.delete(
  '/:campaignId',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('DELETE_BROADCAST_CAMPAIGN'),
  deleteBroadcastCampaign
);

export default router;
