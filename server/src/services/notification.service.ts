import prisma from '../config/database';
import { getIO } from './socket.service';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  WAIVER = 'WAIVER'
}

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export class NotificationService {
  /**
   * Create a notification and emit real-time event
   */
  static async createNotification(params: CreateNotificationParams) {
    const { userId, title, message, type = NotificationType.INFO, link } = params;

    try {
      // 1. Save to database
      const notification = await prisma.userNotification.create({
        data: {
          userId,
          title,
          message,
          type,
          link
        }
      });

      // 2. Emit via socket.io to the specific user's room
      try {
        const io = getIO();
        io.to(userId).emit('notification:new', notification);
        console.log(`[NotificationService] Emitted real-time alert to user ${userId}`);
      } catch (socketError: any) {
        console.warn(`[NotificationService] Real-time emission failed (Socket not ready):`, socketError.message);
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Notify multiple users (e.g., all admins)
   */
  static async notifyRoles(roles: string[], params: Omit<CreateNotificationParams, 'userId'>) {
    const users = await prisma.user.findMany({
      where: {
        role: { in: roles as any },
        status: 'ACTIVE',
        archived: false
      },
      select: { id: true }
    });

    const notifications = await Promise.all(
      users.map(user => this.createNotification({ ...params, userId: user.id }))
    );

    return notifications;
  }

  /**
   * Get unread notifications for a user
   */
  static async getUserNotifications(userId: string, limit = 20) {
    return prisma.userNotification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.userNotification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId: string) {
    return prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
}
