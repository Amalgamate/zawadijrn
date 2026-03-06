import { Response, NextFunction } from 'express';
import { AuthRequest } from './permissions.middleware';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiError } from '../utils/error.util';
import { Role } from '../config/permissions';

export type { AuthRequest };

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyAccessToken(token);
    req.user = decoded;

    // Set school context with schoolId from JWT
    (req as any).schoolContext = {
      schoolId: decoded.schoolId || null
    };

    next();
  } catch (error: any) {
    console.error('❌ Auth Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied. Required roles: ' + roles.join(', ')));
    }
    next();
  };
};

/**
 * Middleware to ensure system is initialized
 */
export const requireSchool = (req: AuthRequest, _res: Response, next: NextFunction) => {
  // In single-tenant, we just assume the system is configured or check if a school exists if needed
  next();
};

/**
 * Middleware to ensure user has access to branch-specific data
 */
export const requireBranch = (req: AuthRequest, _res: Response, next: NextFunction) => {
  // Simplified for single-tenant
  next();
};
