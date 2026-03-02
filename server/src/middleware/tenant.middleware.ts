import { Request, Response, NextFunction } from 'express';

/**
 * Legacy multi-tenant middleware (No-op in single-tenant mode)
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
    // Implicitly always true in single-tenant
    next();
};

/**
 * Legacy multi-tenant middleware (No-op in single-tenant mode)
 */
export const enforceSchoolConsistency = (req: Request, res: Response, next: NextFunction) => {
    // No multiple schools to check consistency against
    next();
};

export const requireSchool = (req: Request, res: Response, next: NextFunction) => next();
export const requireBranch = (req: Request, res: Response, next: NextFunction) => next();
