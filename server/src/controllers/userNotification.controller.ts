import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/permissions.middleware';

export class UserNotificationController {
  /**
   * Get current user's unread notifications
   */
  async getMyNotifications(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const notifications = await NotificationService.getUserNotifications(userId);
    res.json({ success: true, data: notifications });
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await NotificationService.markAsRead(id, userId);
    res.json({ success: true, message: 'Notification marked as read' });
  }

  /**
   * Mark all as read
   */
  async markAllRead(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await NotificationService.markAllAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  }

  /**
   * Return the VAPID public key so the browser can create a push subscription
   */
  async getVapidPublicKey(_req: AuthRequest, res: Response) {
    const publicKey = NotificationService.getVapidPublicKey();
    if (!publicKey) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications are not configured on this server.',
      });
    }
    res.json({ success: true, data: { publicKey } });
  }

  /**
   * Register (or refresh) a browser push subscription for the current user
   */
  async savePushSubscription(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { endpoint, keys, userAgent } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription object. Required: endpoint, keys.p256dh, keys.auth',
      });
    }

    await NotificationService.savePushSubscription({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Push subscription saved.' });
  }
}

export const userNotificationController = new UserNotificationController();
