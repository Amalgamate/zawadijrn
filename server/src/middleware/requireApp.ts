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
 *
 * All denials are routed through next(ApiError) so the global error handler
 * emits the RFC-compliant payload with code + requestId.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './permissions.middleware';
import { ApiError } from '../utils/error.util';
import prisma from '../config/database';

export const requireApp = (slug: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
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

      // Single-tenant fallback: look up first school if none provided
      if (!schoolId) {
        const school = await (prisma as any).school.findFirst({
          select: { id: true },
        });
        schoolId = school?.id;
      }

      if (!schoolId) {
        console.error('[requireApp] Resolution failed: No schoolId found in request or database.');
        return next(
          new ApiError(400, 'schoolId is required to check app access.').withCode('SCHOOL_REQUIRED')
        );
      }

      const resolvedSchoolId = String(schoolId);

      // Find the app definition
      const app = await (prisma as any).app.findUnique({
        where:  { slug },
        select: { id: true, name: true },
      });

      if (!app) {
        return next(
          new ApiError(500, `App '${slug}' is not registered in the system.`).withCode('UNKNOWN_APP')
        );
      }

      // Check per-school config
      const config = await (prisma as any).schoolAppConfig.findUnique({
        where:  { schoolId_appId: { schoolId: resolvedSchoolId, appId: app.id } },
        select: { isActive: true },
      });

      const isActive = config?.isActive ?? true; // default OPEN if no config row exists

      if (!isActive) {
        return next(
          new ApiError(403, `The '${app.name}' module is not enabled for your school.`)
            .withCode('APP_DISABLED')
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
