
import express from 'express';
import { z } from 'zod';
import {
    getCommunicationConfig,
    saveCommunicationConfig,
    sendTestSms,
    sendTestEmail,
    getBirthdaysToday,
    sendBirthdayWishes,
    getBroadcastRecipients,
    getStaffContacts,
    createContactGroup,
    getContactGroups,
    getContactGroupById,
    updateContactGroup,
    deleteContactGroup
} from '../controllers/communication.controller';
import { requireRole, auditLog } from '../middleware/permissions.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = express.Router();

/**
 * Apply authentication and tenant middleware to all routes
 */
router.use(authenticate);
router.use(requireTenant);

// Validation schemas
const saveCommunicationConfigSchema = z.object({
  smsProvider: z.enum(['TWILIO', 'AFRICASTALKING']).optional(),
  emailProvider: z.enum(['GMAIL', 'SENDGRID']).optional(),
  smsApiKey: z.string().min(5).optional(),
  smsSenderId: z.string().max(20).optional(),
  emailApiKey: z.string().min(5).optional(),
  isActive: z.boolean().optional()
});

const sendTestSmsSchema = z.object({
  phoneNumber: z.string().min(10),
  message: z.string().min(1).max(500)
});

const sendTestEmailSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000)
});

const createContactGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  members: z.array(z.string()).optional()
});

/**
 * Communication Routes
 * Base path: /api/communication (defined in index.ts)
 */

// Get Configuration
// Allowed: Admin, Super Admin, Head Teacher
router.get(
    '/config/:schoolId',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 50 }),
    getCommunicationConfig
);

// Save Configuration
// Allowed: Admin, Super Admin
router.post(
    '/config',
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 20 }),
    validate(saveCommunicationConfigSchema),
    auditLog('SAVE_COMMUNICATION_CONFIG'),
    saveCommunicationConfig
);

// Send Test SMS
// Allowed: Admin, Super Admin, Head Teacher
router.post(
    '/test/sms',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 30 }),
    validate(sendTestSmsSchema),
    sendTestSms
);

// Send Test Email
// Allowed: Admin, Super Admin
router.post(
    '/test/email',
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    rateLimit({ windowMs: 60_000, maxRequests: 30 }),
    validate(sendTestEmailSchema),
    sendTestEmail
);

// Birthday Birthdays Today
// Allowed: Admin, Super Admin, Head Teacher
router.get(
    '/birthdays/today/:schoolId',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 100 }),
    getBirthdaysToday
);

// Send Birthday Wishes
// Allowed: Admin, Super Admin, Head Teacher
router.post(
    '/birthdays/send',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 20 }),
    auditLog('SEND_BIRTHDAY_WISHES'),
    sendBirthdayWishes
);

// Get Broadcast Recipients
// Allowed: Admin, Super Admin, Head Teacher
router.get(
    '/recipients',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 100 }),
    getBroadcastRecipients
);

// Get Staff Contacts
// Allowed: Admin, Super Admin, Head Teacher, Teacher
router.get(
    '/staff',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 100 }),
    getStaffContacts
);

// Contact Groups Routes
// Get all contact groups
router.get(
    '/groups',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 100 }),
    getContactGroups
);

// Get contact group by ID
router.get(
    '/groups/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 100 }),
    getContactGroupById
);

// Create contact group
router.post(
    '/groups',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 30 }),
    validate(createContactGroupSchema),
    auditLog('CREATE_CONTACT_GROUP'),
    createContactGroup
);

// Update contact group
router.put(
    '/groups/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 30 }),
    validate(createContactGroupSchema),
    auditLog('UPDATE_CONTACT_GROUP'),
    updateContactGroup
);

// Delete contact group
router.delete(
    '/groups/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER']),
    rateLimit({ windowMs: 60_000, maxRequests: 20 }),
    auditLog('DELETE_CONTACT_GROUP'),
    deleteContactGroup
);

export default router;
