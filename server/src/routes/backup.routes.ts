import { Router } from 'express';
import multer from 'multer';
import * as os from 'os';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { asyncHandler } from '../utils/async.util';
import { BackupController } from '../controllers/backup.controller';

const router = Router();
const backup = new BackupController();

// Multer — store uploaded restore files in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.sql') || file.originalname.endsWith('.sql.gz')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql or .sql.gz files are allowed'));
    }
  },
});

// All backup routes require authentication + SUPER_ADMIN or ADMIN role
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

// List all backups
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  asyncHandler(backup.listBackups.bind(backup))
);

// Create a new manual backup (generous limit — failures used to burn the old cap quickly)
router.post(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  asyncHandler(backup.createBackup.bind(backup))
);

// Download a specific backup file
router.get(
  '/download/:filename',
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  asyncHandler(backup.downloadBackup.bind(backup))
);

// Restore from an uploaded file
router.post(
  '/restore',
  rateLimit({ windowMs: 60_000, maxRequests: 3 }),
  upload.single('file'),
  asyncHandler(backup.restoreBackup.bind(backup))
);

// Delete a specific backup
router.delete(
  '/:filename',
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  asyncHandler(backup.deleteBackup.bind(backup))
);

export default router;
