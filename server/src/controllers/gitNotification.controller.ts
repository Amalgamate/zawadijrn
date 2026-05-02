/**
 * Git Notification Controller
 *
 * Allows SUPER_ADMIN / ADMIN to broadcast a GIT_UPDATE in-app notification
 * to one or more user roles. Reuses NotificationService.notifyRoles() and
 * the existing UserNotification table — no new tables, no new socket events.
 *
 * Endpoints (all under /api/git-notifications):
 *   POST /preview   — validate payload, return preview without saving
 *   POST /publish   — save + broadcast to target roles
 *   GET  /          — list all GIT_UPDATE notifications (paginated)
 */

import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/permissions.middleware';
import { NotificationService, NotificationType } from '../services/notification.service';
import { ApiError } from '../utils/error.util';
import prisma from '../config/database';

// ── Validation ────────────────────────────────────────────────────────────────

const GitNotificationSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(10).max(2000),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'CRITICAL']).default('NORMAL'),
  branch: z.string().max(100).optional().default('main'),
  commitSummary: z.string().max(500).optional().default(''),
  pushedBy: z.string().max(100).optional().default(''),
  commitUrl: z.string().url().optional().or(z.literal('')).default(''),
  targetRoles: z
    .array(
      z.enum([
        'SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER',
        'PARENT', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN',
        'NURSE', 'SECURITY', 'DRIVER', 'COOK', 'CLEANER',
        'GROUNDSKEEPER', 'IT_SUPPORT', 'HEAD_OF_CURRICULUM', 'STUDENT',
      ])
    )
    .min(1, 'Select at least one target role'),
  showAsPopup: z.boolean().default(false),
  saveDraft: z.boolean().default(false),
});

export type GitNotificationInput = z.infer<typeof GitNotificationSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map priority → NotificationType so the existing bell colouring logic works.
 * NORMAL   → INFO
 * IMPORTANT → WARNING
 * CRITICAL  → ERROR
 */
function priorityToType(priority: string): NotificationType {
  if (priority === 'CRITICAL') return NotificationType.ERROR;
  if (priority === 'IMPORTANT') return NotificationType.WARNING;
  return NotificationType.GIT_UPDATE;
}

// ── Controller ────────────────────────────────────────────────────────────────

export class GitNotificationController {
  /**
   * POST /api/git-notifications/preview
   * Validate the payload and return a sanitised preview — nothing is saved.
   */
  async preview(req: AuthRequest, res: Response) {
    const parsed = GitNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join('; '));
    }

    const d = parsed.data;
    res.json({
      success: true,
      data: {
        title: d.title,
        message: d.message,
        priority: d.priority,
        type: priorityToType(d.priority),
        metadata: {
          branch: d.branch,
          commitSummary: d.commitSummary,
          pushedBy: d.pushedBy,
          commitUrl: d.commitUrl,
          priority: d.priority,
        },
        targetRoles: d.targetRoles,
        showAsPopup: d.showAsPopup,
      },
    });
  }

  /**
   * POST /api/git-notifications/publish
   * Save the notification for every user in the target roles and broadcast
   * via socket. Only SUPER_ADMIN / ADMIN may call this.
   */
  async publish(req: AuthRequest, res: Response) {
    const role = req.user?.role as string;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new ApiError(403, 'Only SUPER_ADMIN or ADMIN can publish Git update notifications.');
    }

    const parsed = GitNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join('; '));
    }

    const d = parsed.data;

    // Skip persistence when saving as draft — just return preview
    if (d.saveDraft) {
      return res.json({ success: true, message: 'Saved as draft (not published)', data: null });
    }

    const metadata = {
      branch: d.branch,
      commitSummary: d.commitSummary,
      pushedBy: d.pushedBy || req.user?.email || 'Admin',
      commitUrl: d.commitUrl,
      priority: d.priority,
    };

    const notifications = await NotificationService.notifyRoles(d.targetRoles, {
      title: d.title,
      message: d.message,
      type: priorityToType(d.priority),
      link: d.commitUrl || undefined,
      showAsPopup: d.showAsPopup,
      metadata,
    });

    res.json({
      success: true,
      message: `Git update notification sent to ${notifications.length} user(s).`,
      data: { count: notifications.length },
    });
  }

  /**
   * GET /api/git-notifications
   * Return a paginated list of all GIT_UPDATE notifications (newest first).
   * Only SUPER_ADMIN / ADMIN may call this.
   */
  async list(req: AuthRequest, res: Response) {
    const role = req.user?.role as string;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new ApiError(403, 'Only SUPER_ADMIN or ADMIN can view Git notifications.');
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Fetch one distinct notification per unique (title + createdAt second).
    // Since we fan out to many users, we read the most recent unique entries
    // directly from the DB filtered by type, ordered newest-first.
    const rows = await (prisma as any).userNotification.findMany({
      where: { type: 'GIT_UPDATE' },
      distinct: ['title', 'createdAt'],
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        link: true,
        showAsPopup: true,
        metadata: true,
        createdAt: true,
      },
    });

    const total = await (prisma as any).userNotification.count({
      where: { type: 'GIT_UPDATE' },
    });

    res.json({ success: true, data: rows, total, page, limit });
  }
}

export const gitNotificationController = new GitNotificationController();
