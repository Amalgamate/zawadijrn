import prisma from '../config/database';
import { NotificationService, NotificationType } from './notification.service';

export type ChangelogType = 'FEATURE' | 'FIX' | 'IMPROVEMENT' | 'SECURITY';

interface CreateChangelogParams {
  version: string;
  title: string;
  description: string;
  type?: ChangelogType;
  tags?: string[];
  publish?: boolean; // if true, publish immediately and notify users
}

interface UpdateChangelogParams extends Partial<CreateChangelogParams> {
  id: string;
}

export class ChangelogService {
  /** Fetch all published changelogs (for regular users) */
  static async getPublished(limit = 50) {
    return prisma.systemChangelog.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  /** Fetch all changelogs including drafts (for SUPER_ADMIN) */
  static async getAll(limit = 100) {
    return prisma.systemChangelog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Create a new changelog entry, optionally publishing it */
  static async create(params: CreateChangelogParams) {
    const { version, title, description, type = 'FEATURE', tags = [], publish = false } = params;

    const entry = await prisma.systemChangelog.create({
      data: {
        version,
        title,
        description,
        type,
        tags,
        isPublished: publish,
        publishedAt: publish ? new Date() : null,
      },
    });

    if (publish) {
      await ChangelogService._notifyAllUsers(entry);
    }

    return entry;
  }

  /** Update a changelog entry; if newly published, notify users */
  static async update(params: UpdateChangelogParams) {
    const { id, publish, ...rest } = params;

    const existing = await prisma.systemChangelog.findUnique({ where: { id } });
    if (!existing) throw new Error('Changelog entry not found');

    const wasAlreadyPublished = existing.isPublished;
    const isBeingPublished = publish === true && !wasAlreadyPublished;

    const updated = await prisma.systemChangelog.update({
      where: { id },
      data: {
        ...rest,
        ...(publish !== undefined ? { isPublished: publish } : {}),
        ...(isBeingPublished ? { publishedAt: new Date() } : {}),
      },
    });

    if (isBeingPublished) {
      await ChangelogService._notifyAllUsers(updated);
    }

    return updated;
  }

  /** Delete (hard-delete) a changelog entry */
  static async delete(id: string) {
    return prisma.systemChangelog.delete({ where: { id } });
  }

  /** Send an in-app + push notification to every active user */
  private static async _notifyAllUsers(entry: { id: string; version: string; title: string }) {
    try {
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE', archived: false },
        select: { id: true },
      });

      await Promise.allSettled(
        users.map((u) =>
          NotificationService.createNotification({
            userId: u.id,
            title: `🚀 System Update ${entry.version}`,
            message: entry.title,
            type: NotificationType.INFO,
            link: '/app/comm-notices?tab=changelog',
          })
        )
      );

      console.log(`[ChangelogService] Notified ${users.length} users about update ${entry.version}`);
    } catch (err) {
      console.error('[ChangelogService] Failed to notify users:', err);
    }
  }
}
