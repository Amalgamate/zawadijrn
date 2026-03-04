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
  resetAdmissionSequence
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
  name: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(20).optional(),
  address: z.string().min(1).max(255).optional(),
  motto: z.string().max(255).optional(),
  vision: z.string().max(1000).optional(),
  mission: z.string().max(1000).optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  stampUrl: z.string().optional(),
  brandColor: z.string().max(20).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  welcomeTitle: z.string().max(255).optional(),
  welcomeMessage: z.string().max(1000).optional(),
  onboardingTitle: z.string().max(255).optional(),
  onboardingMessage: z.string().max(1000).optional()
});

const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20),
  location: z.string().min(1).max(255).optional()
});

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
