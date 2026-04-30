import { Router } from 'express';
import { userNotificationController } from '../controllers/userNotification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async.util';

const router = Router();

// Public route: UI may request this before auth is fully established.
router.get('/vapid-public-key', asyncHandler(userNotificationController.getVapidPublicKey.bind(userNotificationController)));

router.use(authenticate);

// In-app notifications
router.get('/',             asyncHandler(userNotificationController.getMyNotifications.bind(userNotificationController)));
router.patch('/:id/read',   asyncHandler(userNotificationController.markAsRead.bind(userNotificationController)));
router.patch('/read-all',   asyncHandler(userNotificationController.markAllRead.bind(userNotificationController)));

// Web Push
router.post('/push-subscription',  asyncHandler(userNotificationController.savePushSubscription.bind(userNotificationController)));

export default router;
