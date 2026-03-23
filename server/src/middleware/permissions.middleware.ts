import { Request, Response, NextFunction } from 'express';
import { Permission, Role, hasPermission } from '../config/permissions';
import prisma from '../config/database';

// Globally augment Express Request to include school and user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
      };
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
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!hasPermission(userRole, permission)) {
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
 * 
 * @example
 * router.get('/reports', requireAnyPermission(['VIEW_ALL_REPORTS', 'VIEW_OWN_REPORTS']), getReports);
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const hasAnyPermission = permissions.some(permission =>
        hasPermission(userRole, permission)
      );

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
 * 
 * @example
 * router.delete('/users/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), deleteUser);
 */
export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!roles.includes(userRole)) {
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
 * Can be extended for specific resource checks (learners, assessments, etc.)
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
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // SUPER_ADMIN, ADMIN, HEAD_TEACHER can access all learners
        if (['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'].includes(userRole)) {
          return next();
        }

        // ACCOUNTANT and RECEPTIONIST can view but not modify
        if (['ACCOUNTANT', 'RECEPTIONIST'].includes(userRole)) {
          if (req.method === 'GET') {
            return next();
          }
          return res.status(403).json({
            success: false,
            message: 'You can only view learner information'
          });
        }

        // TEACHER - check if learner is in their class
        // TEACHER - can view all, but only edit/delete if assigned to class or created record
        if (userRole === 'TEACHER') {
          // Allow all viewing
          if (req.method === 'GET') {
            return next();
          }

          const learnerId = req.params.learnerId || req.params.id || req.body.learnerId || req.query.learnerId;
          if (!learnerId) return next();

          // Check if teacher is the creator of the learner OR assigned to the class
          const learner = await prisma.learner.findUnique({
            where: { id: learnerId as string },
            select: { 
              createdBy: true, 
              enrollments: {
                where: { active: true },
                select: {
                  class: { select: { teacherId: true } }
                }
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

        // PARENT - check if learner is their child
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
            message: 'You can only access your own children\'s information'
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Cannot access this learner'
        });
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
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // SUPER_ADMIN, ADMIN, HEAD_TEACHER can access all assessments
        if (['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'].includes(userRole)) {
          return next();
        }

        // TEACHER - can access assessments for their classes
        // TEACHER - can view all results/tests, but only edit/delete if owner
        if (userRole === 'TEACHER') {
          // Allow all viewing
          if (req.method === 'GET') {
            return next();
          }

          const id = req.params.id || req.body.id || req.body.assessmentId || req.body.testId;
          if (!id) return next();

          // Check if modifying a SummativeResult, SummativeTest, or FormativeAssessment
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

        // PARENT - can view assessments for their children
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
          return res.status(403).json({
            success: false,
            message: 'Parents can only view assessments'
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Cannot access this assessment'
        });
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * Audit log middleware - logs sensitive operations
 * Should be used before operations that modify critical data
 */
export const auditLog = (action: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    // TODO: Implement actual audit logging to database
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      action,
      user: req.user?.email,
      role: req.user?.role,
      ip: req.ip,
      method: req.method,
      path: req.path,
      params: req.params,
    });

    next();
  };
};
