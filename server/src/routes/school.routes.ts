import express, { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createSchoolWithProvisioning,
  getSchool,
  updateSchool,
  configureInstitutionTypeLock,
  getInstitutionSetupProgress,
  resetWholeInstitution,
  deleteSchool,
  deactivateSchool,
  getAdmissionSequence,
  getAdmissionNumberPreview,
  resetAdmissionSequence,
  getPublicBranding
} from '../controllers/school.controller';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { asyncHandler } from '../utils/async.util';
import { z } from 'zod';

const router = Router();

const updateSchoolSchema = z.object({
  name: z.string().min(3).max(100).optional().nullable(),
  email: z.string().email().or(z.literal('')).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  motto: z.string().max(255).optional().nullable(),
  vision: z.string().max(2000).optional().nullable(),
  mission: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  stampUrl: z.string().optional().nullable(),
  brandColor: z.string().max(20).optional().nullable(),
  primaryColor: z.string().max(20).optional().nullable(),
  secondaryColor: z.string().max(20).optional().nullable(),
  accentColor1: z.string().max(20).optional().nullable(),
  accentColor2: z.string().max(20).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  welcomeTitle: z.string().max(255).optional().nullable(),
  welcomeMessage: z.string().max(2000).optional().nullable(),
  onboardingTitle: z.string().max(255).optional().nullable(),
  onboardingMessage: z.string().max(2000).optional().nullable()
});

const configureInstitutionSchema = z.object({
  institutionType: z.enum(['PRIMARY_CBC', 'SECONDARY', 'TERTIARY'])
});

const resetWholeInstitutionSchema = z.object({
  confirmToken: z.literal('RESET_WHOLE_INSTITUTION')
});

// Public branding route (no auth)
router.get('/public/branding', rateLimit({ windowMs: 60_000, maxRequests: 100 }), asyncHandler(getPublicBranding));

// Protect all routes below
router.use(authenticate);

// ============================================
// SCHOOL MANAGEMENT ROUTES (single-tenant)
// ============================================

router.post('/provision',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  asyncHandler(createSchoolWithProvisioning)
);

router.get('/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(getSchool)
);

// Fallback for obsolete ID-based fetches from frontend
router.get('/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(getSchool)
);

router.put('/',
  authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  express.json({ limit: '10mb' }),   // logo/favicon/stamp are base64 — needs a higher limit
  validate(updateSchoolSchema),
  asyncHandler(updateSchool)
);

router.post('/institution-type/lock',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  express.json(),
  validate(configureInstitutionSchema),
  asyncHandler(configureInstitutionTypeLock)
);

router.get('/institution-setup/progress/:institutionType',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 60 }),
  asyncHandler(getInstitutionSetupProgress)
);

router.post('/maintenance/reset-whole-institution',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 2 }),
  express.json(),
  validate(resetWholeInstitutionSchema),
  asyncHandler(resetWholeInstitution)
);

router.delete('/',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(deleteSchool)
);

router.post('/deactivate',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(deactivateSchool)
);

// ============================================
// ADMISSION SEQUENCE ROUTES
// ============================================

router.get('/admission-sequence/:academicYear',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(getAdmissionSequence)
);

router.get('/admission-number-preview/:academicYear',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(getAdmissionNumberPreview)
);

router.post('/reset-sequence',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  asyncHandler(resetAdmissionSequence)
);

export default router;
