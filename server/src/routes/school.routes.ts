import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  createSchoolWithProvisioning,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  deactivateSchool,
  createBranch,
  getBranchesBySchool,
  getBranchById,
  updateBranch,
  deleteBranch,
  getAdmissionSequence,
  getAdmissionNumberPreview,
  resetAdmissionSequence,
  getPublicBranding
} from '../controllers/school.controller';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createSchoolSchema = z.object({
  name: z.string().min(3).max(100),
  code: z.string().min(1).max(20),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(20).optional(),
  address: z.string().min(1).max(255).optional()
});

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
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  welcomeTitle: z.string().max(255).optional().nullable(),
  welcomeMessage: z.string().max(2000).optional().nullable(),
  onboardingTitle: z.string().max(255).optional().nullable(),
  onboardingMessage: z.string().max(2000).optional().nullable()
});

const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20),
  location: z.string().min(1).max(255).optional()
});

// Public branding route
router.get('/public/branding', rateLimit({ windowMs: 60_000, maxRequests: 100 }), getPublicBranding);

// Protect all routes
router.use(authenticate);

// ============================================
// SCHOOL MANAGEMENT ROUTES
// ============================================

router.post('/provision',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  validate(createSchoolSchema),
  createSchoolWithProvisioning
);

router.get('/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getAllSchools
);

router.get('/:id',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getSchoolById
);

router.put('/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(updateSchoolSchema),
  updateSchool
);

router.delete('/:id',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  deleteSchool
);

router.post('/:id/deactivate',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  deactivateSchool
);

// ============================================
// BRANCH MANAGEMENT ROUTES
// ============================================

router.post('/branches',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createBranchSchema),
  createBranch
);

router.get('/branches',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getBranchesBySchool
);

router.get('/branches/:branchId',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  getBranchById
);

router.put('/branches/:branchId',
  authorize('SUPER_ADMIN', 'ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(z.object({
    name: z.string().min(2).max(100).optional(),
    location: z.string().min(1).max(255).optional()
  })),
  updateBranch
);

router.delete('/branches/:branchId',
  authorize('SUPER_ADMIN'),
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  deleteBranch
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
