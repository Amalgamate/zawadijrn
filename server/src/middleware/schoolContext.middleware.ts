import { Response, NextFunction } from 'express';
import { AuthRequest, School } from './permissions.middleware';
import prisma from '../config/database';
import logger from '../utils/logger';

let cachedSchool: School | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware to fetch and cache the school context.
 * This replaces institutionType from the JWT and ensures the app uses
 * the latest configuration from the database.
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
        where: { active: true },
      });
      
      if (!school) {
        logger.warn('[SchoolContext] No active school record found in database.');
      } else {
        cachedSchool = school as unknown as School;
        lastFetch = now;
      }
    }
    
    // Attach to request
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
  lastFetch = 0;
};
