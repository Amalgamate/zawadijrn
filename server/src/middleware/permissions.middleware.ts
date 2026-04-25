import { Request, Response, NextFunction } from 'express';
import { Permission, Role, hasPermission } from '../config/permissions';
import prisma from '../config/database';

type InstitutionType = 'PRIMARY_CBC' | 'SECONDARY' | 'TERTIARY';

export interface School {
  id: string;
  name: string;
  institutionType: InstitutionType;
  [key: string]: any;
}

// Globally augment Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
      };
      school?: School;
    }
  }
}

/**
 * Extended Request interface with user information and common middleware properties
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: Role;
  };
  school?: School;
  file?: any;
  files?: any;
  headers: any;
  body: any;
  query: any;
  [key: string]: any;
}

/**
 * Middleware to check if user has required permission
 *
 * @param permission - The permission to check
 * @returns Express middleware function
 *
 * @example
 * router.post('/learners', requirePermission('CREATE_LEARNER'), createLearner);
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role?.toUpperCase();

      if (!userRole) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      if (!hasPermission(userRole as Role, permission)) {
        console.warn(`[PERMISSIONS] 403 Forbidden: User ${req.user?.email} (${userRole}) lacks permission ${permission} for ${req.method} ${req.originalUrl}`);
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: permission,
          userRole: userRole
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 *
 * @param permissions - Array of permissions, user needs at least one
 * @returns Express middleware function
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const hasAnyPermission = permissions.some(permission => hasPermission(userRole, permission));

      if (!hasAnyPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: permissions,
          userRole: userRole
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has a specific role
 *
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role?.toUpperCase();

      if (!userRole) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const normalizedAllowedRoles = roles.map(r => r.toUpperCase());

      if (!normalizedAllowedRoles.includes(userRole)) {
        console.warn(`[PERMISSIONS] 403 Access Denied: User ${req.user?.email} (${userRole}) is not in allowed roles [${roles.join(', ')}] for ${req.method} ${req.originalUrl}`);
        res.status(403).json({
          success: false,
          message: 'Access denied',
          allowedRoles: roles,
          userRole: userRole
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory for resource-level access control
 */
export class ResourceAccessControl {
  /**
   * Check if user can access a specific learner
   * - SUPER_ADMIN, ADMIN, HEAD_TEACHER: Can access all learners
   * - TEACHER: Can access learners in their assigned classes
   * - PARENT: Can access only their own children
   */
  static canAccessLearner() {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;

        if (!userRole || !userId) {
          return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        if (['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'].includes(userRole)) {
          return next();
        }

        if (['ACCOUNTANT', 'RECEPTIONIST'].includes(userRole)) {
          if (req.method === 'GET') return next();
          return res.status(403).json({ success: false, message: 'You can only view learner information' });
        }

        if (userRole === 'TEACHER') {
          if (req.method === 'GET') return next();

          const learnerId = req.params.learnerId || req.params.id || req.body.learnerId || req.query.learnerId;
          if (!learnerId) return next();

          const learner = await prisma.learner.findUnique({
            where: { id: learnerId as string },
            select: {
              createdBy: true,
              enrollments: {
                where: { active: true },
                select: { class: { select: { teacherId: true } } }
              }
            }
          });

          if (!learner) return next();

          const isCreator = learner.createdBy === userId;
          const isClassTeacher = learner.enrollments.some(e => e.class?.teacherId === userId);

          if (isCreator || isClassTeacher) return next();

          return res.status(403).json({
            success: false,
            message: 'You can only modify learners in your assigned classes or records you created'
          });
        }

        if (userRole === 'PARENT') {
          const learnerId = req.params.learnerId || req.body.learnerId || req.query.learnerId;
          if (!learnerId) return next();

          const learner = await prisma.learner.findUnique({
            where: { id: learnerId },
            select: { parentId: true }
          });

          if (learner && learner.parentId === userId) return next();
          return res.status(403).json({
            success: false,
            message: "You can only access your own children's information"
          });
        }

        return res.status(403).json({ success: false, message: 'Cannot access this learner' });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check if user can access a specific assessment
   */
  static canAccessAssessment() {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;

        if (!userRole || !userId) {
          return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        if (['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'].includes(userRole)) {
          return next();
        }

        if (userRole === 'TEACHER') {
          if (req.method === 'GET') return next();

          const id = req.params.id || req.body.id || req.body.assessmentId || req.body.testId;
          if (!id) return next();

          const [result, test, formative] = await Promise.all([
            prisma.summativeResult.findUnique({ where: { id: id as string }, select: { recordedBy: true } }),
            prisma.summativeTest.findUnique({ where: { id: id as string }, select: { createdBy: true } }),
            prisma.formativeAssessment.findUnique({ where: { id: id as string }, select: { teacherId: true } })
          ]);

          const isOwner =
            (result?.recordedBy === userId) ||
            (test?.createdBy === userId) ||
            (formative?.teacherId === userId);

          if (isOwner) return next();

          return res.status(403).json({
            success: false,
            message: 'You can only modify assessments you recorded or tests you created'
          });
        }

        if (userRole === 'PARENT') {
          if (req.method === 'GET') {
            const learnerId = req.query.learnerId || req.body.learnerId;
            if (!learnerId) return next();

            const learner = await prisma.learner.findUnique({
              where: { id: learnerId as string },
              select: { parentId: true }
            });

            if (learner && learner.parentId === userId) return next();
            return res.status(403).json({
              success: false,
              message: 'You can only view assessments for your own children'
            });
          }
          return res.status(403).json({ success: false, message: 'Parents can only view assessments' });
        }

        return res.status(403).json({ success: false, message: 'Cannot access this assessment' });
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * Audit log middleware — persists sensitive operations to the database.
 * Failures are logged but never block the request.
 */
export const auditLog = (action: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          userId:    req.user?.userId  || null,
          userEmail: req.user?.email   || null,
          userRole:  req.user?.role    || null,
          ipAddress: req.ip            || null,
          method:    req.method,
          path:      req.path,
          params:    JSON.stringify(req.params),
        }
      });
    } catch (e) {
      console.error('[AUDIT] Failed to write audit log:', e);
    }
    next();
  };
};
