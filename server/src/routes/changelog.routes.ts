import { Router } from 'express';
import { changelogController } from '../controllers/changelog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';

const router = Router();

router.use(authenticate);

// All authenticated users can read published changelogs
router.get('/', asyncHandler(changelogController.getPublished.bind(changelogController)));

// SUPER_ADMIN only
router.get('/all',    requireRole(['SUPER_ADMIN']), asyncHandler(changelogController.getAll.bind(changelogController)));
router.post('/',      requireRole(['SUPER_ADMIN']), asyncHandler(changelogController.create.bind(changelogController)));
router.patch('/:id',  requireRole(['SUPER_ADMIN']), asyncHandler(changelogController.update.bind(changelogController)));
router.delete('/:id', requireRole(['SUPER_ADMIN']), asyncHandler(changelogController.delete.bind(changelogController)));

export default router;
