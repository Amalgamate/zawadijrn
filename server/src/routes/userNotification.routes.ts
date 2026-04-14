import { Router } from 'express';
import { userNotificationController } from '../controllers/userNotification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async.util';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(userNotificationController.getMyNotifications.bind(userNotificationController)));
router.patch('/:id/read', asyncHandler(userNotificationController.markAsRead.bind(userNotificationController)));
router.patch('/read-all', asyncHandler(userNotificationController.markAllRead.bind(userNotificationController)));

export default router;
