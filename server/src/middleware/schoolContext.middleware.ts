/**
 * schoolContext.middleware.ts
 *
 * Fetches and caches the active school record and attaches it to req.school.
 * Does NOT resolve institution context — that is institutionContextResolver's job.
 *
 * Mount order in server.ts:
 *   schoolContextMiddleware  →  institutionContextResolver  →  routes
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, School } from './permissions.middleware';
import prisma from '../config/database';
import logger from '../utils/logger';
import { normalizeInstitutionTypeOrDefault } from '../utils/institutionNormalizer';

let cachedSchool: School | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware to fetch and cache the school context.
 * Attaches a single, consistently-typed req.school to every request.
 * institutionType on req.school is normalized to a canonical value before
 * being stored so callers always see a known string.
 */
export const schoolContextMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const now = Date.now();

    // Refresh cache if expired or not set
    if (!cachedSchool || (now - lastFetch) > CACHE_TTL) {
      const school = await prisma.school.findFirst({
        where: { active: true, archived: false },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      });

      if (!school) {
        logger.warn('[SchoolContext] No active school record found in database.');
      } else {
        // Normalize institutionType at cache-fill time so all downstream
        // code always sees a canonical value on req.school.
        const canonicalType = normalizeInstitutionTypeOrDefault(school.institutionType);
        cachedSchool = {
          ...(school as unknown as School),
          institutionType: canonicalType,
        };
        lastFetch = now;
      }
    }

    if (cachedSchool) {
      req.school = cachedSchool;
    }

    next();
  } catch (error) {
    logger.error({ err: error }, '[SchoolContext] Error resolving school context:');
    next();
  }
};

/**
 * Utility to clear the school cache (e.g. after updating school settings)
 */
export const clearSchoolCache = () => {
  cachedSchool = null;
  lastFetch    = 0;
};
