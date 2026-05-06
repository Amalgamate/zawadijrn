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
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ') && !authHeader.includes('__cookie__')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error: any) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      console.error(`[Auth] Authentication failed: ${error.message} (Name: ${error.name})`);
    }

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
    const userRoles = req.user
      ? (req.user.roles && req.user.roles.length > 0 ? req.user.roles : [req.user.role])
      : [];
    if (!req.user || !userRoles.some(r => roles.includes(r))) {
      return next(new ApiError(403, 'Access denied. Required roles: ' + roles.join(', ')));
    }
    next();
  };
};

