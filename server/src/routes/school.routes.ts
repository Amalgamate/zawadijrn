import express, { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createSchoolWithProvisioning,
  getSchool,
  updateSchool,
  deleteSchool,
  deactivateSchool,
  getAdmissionSequence,
  getAdmissionNumberPreview,
  resetAdmissionSequence,
  getPublicBranding
} from '../controllers/school.controller';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
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

// Public branding route (no auth)
router.get('/public/branding', rateLimit({ windowMs: 60_000, maxRequests: 100 }), getPublicBranding);

// Protect all routes below
router.use(authenticate);

// ============================================
// SCHOOL MANAGEMENT ROUTES (single-tenant)
// ============================================

router.post('/provision',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  createSchoolWithProvisioning
);

router.get('/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getSchool
);

// Fallback for obsolete ID-based fetches from frontend
router.get('/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getSchool
);

router.put('/',
  authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  express.json({ limit: '10mb' }),   // logo/favicon/stamp are base64 — needs a higher limit
  validate(updateSchoolSchema),
  updateSchool
);

router.delete('/',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  deleteSchool
);

router.post('/deactivate',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  deactivateSchool
);

// ============================================
// ADMISSION SEQUENCE ROUTES
// ============================================

router.get('/admission-sequence/:academicYear',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getAdmissionSequence
);

router.get('/admission-number-preview/:academicYear',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getAdmissionNumberPreview
);

router.post('/reset-sequence',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  resetAdmissionSequence
);

export default router;
