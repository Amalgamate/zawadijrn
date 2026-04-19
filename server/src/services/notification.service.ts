import prisma from '../config/database';
import { getIO } from './socket.service';
import webpush from 'web-push';
import { PushSubscription } from '@prisma/client';

// ---------------------------------------------------------------------------
// VAPID initialisation — runs once when the module is first imported
// ---------------------------------------------------------------------------
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     || 'mailto:admin@zawadisms.co.ke';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
  console.warn('[NotificationService] VAPID keys not configured — push notifications will be skipped.');
}

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

      // 3. Fire a background Web Push so the user is notified even if the tab is closed
      NotificationService.sendPushToUser(userId, {
        title,
        body: message,
        url: link || '/',
        tag: `zawadi-${notification.id}`,
      }).catch((err) =>
        console.warn('[NotificationService] Push delivery error:', err?.message)
      );

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

  // -------------------------------------------------------------------------
  // Web Push
  // -------------------------------------------------------------------------

  /** Return the VAPID public key for the client to subscribe with */
  static getVapidPublicKey(): string {
    return VAPID_PUBLIC;
  }

  /** Persist a new push subscription (upsert by endpoint) */
  static async savePushSubscription(params: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: params.endpoint },
      update: {
        userId: params.userId,
        p256dh: params.p256dh,
        auth: params.auth,
        userAgent: params.userAgent,
      },
      create: {
        userId: params.userId,
        endpoint: params.endpoint,
        p256dh: params.p256dh,
        auth: params.auth,
        userAgent: params.userAgent,
      },
    });
  }

  /** Send a push notification to every registered device of a user */
  static async sendPushToUser(
    userId: string,
    payload: { title: string; body: string; url?: string; tag?: string }
  ) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          );
        } catch (err: any) {
          // 410 Gone = subscription expired — clean it up
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            console.log(`[Push] Removed stale subscription ${sub.id} for user ${userId}`);
          } else {
            console.warn(`[Push] Failed to send to subscription ${sub.id}:`, err.message);
          }
        }
      })
    );

    return results;
  }
}