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
}

export const userNotificationController = new UserNotificationController();
