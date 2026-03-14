import { Request, Response, NextFunction } from 'express';

/**
 * Pass-through for single-tenant architecture.
 * In a more restrictive setup, this could verify a School record exists.
 */
export const requireSchoolContext = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).schoolContext = { schoolId: null };
  next();
};

/**
 * Pass-through for single-tenant architecture.
 */
export const enforceSchoolContextConsistency = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).schoolContext = { schoolId: null };
  next();
};

export const requireSchool = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).schoolContext = (req as any).schoolContext || { schoolId: null };
  next();
};

export const requireBranch = (_req: Request, _res: Response, next: NextFunction) => next();
