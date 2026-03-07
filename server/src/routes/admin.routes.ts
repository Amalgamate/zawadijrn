import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditLog } from '../middleware/permissions.middleware';
import { AdminController } from '../controllers/admin.controller';
import { asyncHandler } from '../utils/async.util';

const router = Router();
const admin = new AdminController();

// Validation Schemas
const provisionSchoolSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  county: z.string().min(2).max(100),
  subCounty: z.string().min(2).max(100),
  schoolType: z.enum(['PRIMARY', 'SECONDARY', 'MIXED']),
  maxStudents: z.number().int().min(10).max(5000),
  registrationNumber: z.string().min(1).max(50),
});

const updateSchoolCommunicationSchema = z.object({
  smsProvider: z.enum(['TWILIO', 'AFRICASTALKING', 'CUSTOM']).optional(),
  smsApiKey: z.string().min(1).optional(),
  emailProvider: z.enum(['SENDGRID', 'MAILGUN', 'CUSTOM']).optional(),
  emailApiKey: z.string().min(1).optional(),
  mpesaBusinessCode: z.string().min(1).optional(),
  mpesaPasskey: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

const approvePaymentSchema = z.object({
  paymentId: z.string().min(1),
  approvalNotes: z.string().min(1).max(500).optional(),
  approvalDate: z.string().datetime().optional(),
});

const setSchoolModuleSchema = z.object({
  moduleKey: z.string().min(1),
  isEnabled: z.boolean(),
  settings: z.record(z.any()).optional(),
});

router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN']));

// School Management
router.get(
  '/schools',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.listSchools.bind(admin))
);

router.post(
  '/schools/provision',
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  validate(provisionSchoolSchema),
  auditLog('ADMIN_PROVISION_SCHOOL'),
  asyncHandler(admin.provisionSchool.bind(admin))
);

router.get(
  '/schools/deleted',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.listDeletedSchools.bind(admin))
);

router.get(
  '/schools/:schoolId/statistics',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.getSchoolStatistics.bind(admin))
);

router.delete(
  '/schools/:schoolId',
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('ADMIN_DELETE_SCHOOL'),
  asyncHandler(admin.deleteSchoolWithOptions.bind(admin))
);

router.post(
  '/schools/:schoolId/restore',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('ADMIN_RESTORE_SCHOOL'),
  asyncHandler(admin.restoreSchool.bind(admin))
);

router.get(
  '/schools/:schoolId/communication',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.getSchoolCommunication.bind(admin))
);

router.put(
  '/schools/:schoolId/communication',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(updateSchoolCommunicationSchema),
  auditLog('ADMIN_UPDATE_SCHOOL_COMMUNICATION'),
  asyncHandler(admin.updateSchoolCommunication.bind(admin))
);

// Subscription & Plans
router.get(
  '/plans',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.listPlans.bind(admin))
);

router.patch(
  '/schools/:schoolId/reactivate',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('ADMIN_REACTIVATE_SCHOOL'),
  asyncHandler(admin.reactivateSchool.bind(admin))
);

router.patch(
  '/schools/:schoolId/approve-payment',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(approvePaymentSchema),
  auditLog('ADMIN_APPROVE_PAYMENT'),
  asyncHandler(admin.approvePayment.bind(admin))
);

// Metrics & Modules
router.get(
  '/trials/metrics',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.trialMetrics.bind(admin))
);

router.get(
  '/schools/:schoolId/modules',
  rateLimit({ windowMs: 60_000, maxRequests: 50 }),
  asyncHandler(admin.getSchoolModules.bind(admin))
);

router.patch(
  '/schools/:schoolId/modules/:moduleKey',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(setSchoolModuleSchema),
  auditLog('ADMIN_SET_SCHOOL_MODULE'),
  asyncHandler(admin.setSchoolModule.bind(admin))
);

// Context Switching
router.post(
  '/switch-school/:schoolId',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('ADMIN_SWITCH_SCHOOL_CONTEXT'),
  asyncHandler(admin.switchSchool.bind(admin))
);

export default router;
