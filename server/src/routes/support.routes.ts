
import { Router } from 'express';
import { z } from 'zod';
import { createTicket, getTickets, getTicket, addMessage, updateTicket } from '../controllers/support.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

// Validation schemas
const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  category: z.string().max(100).optional()
});

const addMessageSchema = z.object({
  message: z.string().min(1).max(5000)
});

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @route   POST /api/support
 * @desc    Create support ticket
 * @access  Authenticated
 */
router.post(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  validate(createTicketSchema),
  auditLog('CREATE_SUPPORT_TICKET'),
  createTicket
);

/**
 * @route   GET /api/support
 * @desc    Get user's support tickets
 * @access  Authenticated
 */
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getTickets
);

/**
 * @route   GET /api/support/:id
 * @desc    Get specific support ticket
 * @access  Authenticated
 */
router.get(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getTicket
);

/**
 * @route   POST /api/support/:id/messages
 * @desc    Add message to support ticket
 * @access  Authenticated
 */
router.post(
  '/:id/messages',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  validate(addMessageSchema),
  auditLog('ADD_TICKET_MESSAGE'),
  addMessage
);

/**
 * @route   PATCH /api/support/:id
 * @desc    Update support ticket status
 * @access  Authenticated
 */
router.patch(
  '/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  auditLog('UPDATE_SUPPORT_TICKET'),
  updateTicket
);

export default router;
