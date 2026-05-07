import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { AppsService } from '../services/apps.service';
import prisma from '../config/database';

export class AppsController {

  /** GET /settings/apps?schoolId=xxx */
  async listApps(req: AuthRequest, res: Response) {
    let schoolId = (req.query.schoolId as string) || req.body.schoolId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    // Single-tenant fallback: Auto-resolve if not provided
    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school provisioned. Please set up a school first.' });
    }

    const apps = await AppsService.listApps(schoolId as string, isSuperAdmin);
    res.json({ success: true, data: apps });
  }

  /** PATCH /settings/apps/:slug/toggle */
  async toggleApp(req: AuthRequest, res: Response) {
    const { slug } = req.params;
    let schoolId = (req.query.schoolId as string) || req.body.schoolId;

    // Single-tenant fallback: Auto-resolve if not provided
    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required' });
    }

    const result = await AppsService.toggleApp({
      schoolId: schoolId as string,
      slug,
      performedByUserId: req.user!.userId,
      performedByRole:   req.user!.role,
      ipAddress:         req.ip,
      userAgent:         req.headers['user-agent'],
    });

    res.json({ success: true, data: result });
  }

  /** PATCH /settings/apps/enable-all */
  async enableAllApps(req: AuthRequest, res: Response) {
    let schoolId = (req.query.schoolId as string) || req.body.schoolId;

    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required' });
    }

    const result = await AppsService.enableAllApps({
      schoolId,
      performedByUserId: req.user!.userId,
      performedByRole: req.user!.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, data: result });
  }

  /** PATCH /settings/apps/:slug/mandatory — SUPER_ADMIN only */
  async setMandatory(req: AuthRequest, res: Response) {
    const { slug } = req.params;
    let { schoolId, isMandatory } = req.body;

    // Single-tenant fallback
    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }

    if (!schoolId || isMandatory === undefined) {
      return res.status(400).json({ success: false, message: 'schoolId and isMandatory are required' });
    }

    const result = await AppsService.setMandatory({
      schoolId,
      slug,
      isMandatory: Boolean(isMandatory),
      performedByUserId: req.user!.userId,
      performedByRole:   req.user!.role,
      ipAddress:         req.ip,
      userAgent:         req.headers['user-agent'],
    });

    res.json({ success: true, data: result });
  }

  /** PATCH /settings/apps/:slug/visibility — SUPER_ADMIN only */
  async setVisibility(req: AuthRequest, res: Response) {
    const { slug } = req.params;
    let { schoolId, isVisible } = req.body;

    // Single-tenant fallback
    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }

    if (!schoolId || isVisible === undefined) {
      return res.status(400).json({ success: false, message: 'schoolId and isVisible are required' });
    }

    const result = await AppsService.setVisibility({
      schoolId,
      slug,
      isVisible: Boolean(isVisible),
      performedByUserId: req.user!.userId,
      performedByRole:   req.user!.role,
      ipAddress:         req.ip,
      userAgent:         req.headers['user-agent'],
    });

    res.json({ success: true, data: result });
  }

  /** GET /settings/apps/audit?schoolId=xxx — SUPER_ADMIN only */
  async getFullAuditLog(req: AuthRequest, res: Response) {
    let schoolId: string | undefined = req.query.schoolId as string;
    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required' });
    }
    const logs = await AppsService.getFullAuditLog(schoolId as string);
    res.json({ success: true, data: logs });
  }

  /** GET /settings/apps/audit/mine?schoolId=xxx — Admin */
  async getMyAuditLog(req: AuthRequest, res: Response) {
    let schoolId: string | undefined = req.query.schoolId as string;
    if (!schoolId) {
      const school = await (prisma as any).school.findFirst({ select: { id: true } });
      schoolId = school?.id;
    }
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId is required' });
    }
    const logs = await AppsService.getMyAuditLog(schoolId as string, req.user!.userId);
    res.json({ success: true, data: logs });
  }
}

export const appsController = new AppsController();
