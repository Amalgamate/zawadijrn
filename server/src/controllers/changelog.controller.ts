import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { ChangelogService } from '../services/changelog.service';

export class ChangelogController {
  /** GET /changelogs — published entries (all authenticated users) */
  async getPublished(_req: AuthRequest, res: Response) {
    const entries = await ChangelogService.getPublished();
    res.json({ success: true, data: entries });
  }

  /** GET /changelogs/all — all entries including drafts (SUPER_ADMIN only) */
  async getAll(_req: AuthRequest, res: Response) {
    const entries = await ChangelogService.getAll();
    res.json({ success: true, data: entries });
  }

  /** POST /changelogs — create entry (SUPER_ADMIN only) */
  async create(req: AuthRequest, res: Response) {
    const { version, title, description, type, tags, publish } = req.body;

    if (!version || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'version, title, and description are required.',
      });
    }

    const entry = await ChangelogService.create({ version, title, description, type, tags, publish });
    res.status(201).json({ success: true, data: entry });
  }

  /** PATCH /changelogs/:id — update entry (SUPER_ADMIN only) */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { version, title, description, type, tags, publish } = req.body;

    const entry = await ChangelogService.update({ id, version, title, description, type, tags, publish });
    res.json({ success: true, data: entry });
  }

  /** DELETE /changelogs/:id — hard delete (SUPER_ADMIN only) */
  async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    await ChangelogService.delete(id);
    res.json({ success: true, message: 'Changelog entry deleted.' });
  }
}

export const changelogController = new ChangelogController();
