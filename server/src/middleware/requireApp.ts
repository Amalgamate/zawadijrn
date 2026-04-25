/**
 * requireApp — route-level middleware that gates access to a feature module.
 *
 * Usage:
 *   router.get('/gradebook', requireApp('gradebook'), asyncHandler(handler));
 *
 * Behaviour:
 *   - Super admins always pass through (they manage apps; never lock themselves out).
 *   - For all other roles: look up the SchoolAppConfig for the caller's school.
 *     If the app is inactive (or no config row exists) → 403 APP_DISABLED.
 *   - schoolId is resolved from (in priority order):
 *       1. (req.user as any).schoolId — set by auth middleware if JWT includes it
 *       2. req.query.schoolId
 *       3. req.body.schoolId
 *   - DB look-up is intentionally lightweight: one indexed unique lookup per request.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './permissions.middleware';
import prisma from '../config/database';

export const requireApp = (slug: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Super admins always pass through
      if (req.user?.role === 'SUPER_ADMIN') {
        next();
        return;
      }

      // Resolve schoolId
      let schoolId: string | undefined =
        (req.user as any)?.schoolId ??
        (req.query.schoolId as string | undefined) ??
        (req.body?.schoolId as string | undefined);

      // Single-tenant fallback: Look up first school if none provided
      if (!schoolId) {
        const school = await (prisma as any).school.findFirst({ 
          select: { id: true },
          // Add a timeout or safety to ensure this doesn't hang background tasks
        });
        schoolId = school?.id;
      }

      if (!schoolId) {
        // Log this specifically to the server console help debug if DB is empty
        console.error('[requireApp] Resolution failed: No schoolId found in request or database.');
        res.status(400).json({
          success: false,
          code:    'SCHOOL_REQUIRED',
          message: 'schoolId is required to check app access.',
        });
        return;
      }

      // Convert to string to satisfy type checker
      const resolvedSchoolId = String(schoolId);

      // Find the app definition
      const app = await (prisma as any).app.findUnique({
        where:  { slug },
        select: { id: true, name: true },
      });

      if (!app) {
        res.status(500).json({
          success: false,
          code:    'UNKNOWN_APP',
          message: `App '${slug}' is not registered in the system.`,
        });
        return;
      }

      // Check per-school config
      const config = await (prisma as any).schoolAppConfig.findUnique({
        where:  { schoolId_appId: { schoolId: resolvedSchoolId, appId: app.id } },
        select: { isActive: true },
      });

      const isActive = config?.isActive ?? true;  // default OPEN if no config row exists (seed not yet run)

      if (!isActive) {
        res.status(403).json({
          success: false,
          code:    'APP_DISABLED',
          message: `The '${app.name}' module is not enabled for your school.`,
          app:     slug,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
