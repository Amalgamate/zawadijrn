import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/permissions.middleware';



export class NoticeController {
  async getNotices(req: AuthRequest, res: Response) {
    try {

      const { status, category, includeArchived } = req.query;
      const notices = await prisma.notice.findMany({
        where: {
          ...(includeArchived === 'true' ? {} : { archived: false }),
          ...(status ? { status: String(status) } : {}),
          ...(category ? { category: String(category) } : {})
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      });

      return res.json({ success: true, data: notices });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch notices' });
    }
  }

  async getNoticeById(req: AuthRequest, res: Response) {
    try {

      const notice = await prisma.notice.findFirst({
        where: {
          id: req.params.id,
          archived: false
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!notice) {
        return res.status(404).json({ success: false, error: 'Notice not found' });
      }

      return res.json({ success: true, data: notice });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch notice' });
    }
  }

  async createNotice(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(403).json({ success: false, error: 'Authentication required' });
      }

      const { title, content, category, priority, status, targetAudience, publishedAt, expiresAt } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'title and content are required' });
      }

      const notice = await prisma.notice.create({
        data: {
          createdById: userId,
          title,
          content,
          category: category || null,
          priority: priority || 'NORMAL',
          status: status || 'PUBLISHED',
          targetAudience: targetAudience || null,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null
        }
      });

      return res.status(201).json({ success: true, message: 'Notice created', data: notice });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to create notice' });
    }
  }

  async updateNotice(req: AuthRequest, res: Response) {
    try {

      const existing = await prisma.notice.findFirst({ where: { id: req.params.id, archived: false } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Notice not found' });
      }

      const { title, content, category, priority, status, targetAudience, publishedAt, expiresAt } = req.body;
      const updated = await prisma.notice.update({
        where: { id: req.params.id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(content !== undefined ? { content } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(priority !== undefined ? { priority } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(targetAudience !== undefined ? { targetAudience } : {}),
          ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}),
          ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {})
        }
      });

      return res.json({ success: true, message: 'Notice updated', data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to update notice' });
    }
  }

  async deleteNotice(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        return res.status(403).json({ success: false, error: 'Authentication required' });
      }

      const existing = await prisma.notice.findFirst({
        where: { id: req.params.id, archived: false },
        include: {
          createdBy: {
            select: {
              role: true
            }
          }
        }
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Notice not found' });
      }

      const isOwner = existing.createdById === userId;
      const isSystemAdminOwner = isOwner && userRole === 'SUPER_ADMIN';

      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'You can only archive your own notices' });
      }

      if (isSystemAdminOwner) {
        await prisma.notice.delete({
          where: { id: req.params.id }
        });

        return res.json({ success: true, message: 'Notice deleted permanently' });
      }

      await prisma.notice.update({
        where: { id: req.params.id },
        data: { archived: true, archivedAt: new Date(), archivedBy: userId }
      });

      return res.json({ success: true, message: 'Notice archived' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to delete notice' });
    }
  }
}

export const noticeController = new NoticeController();