import { Request, Response, NextFunction } from 'express';

const resolveSchoolId = (req: Request): string | undefined => {
  const headerSchoolId = req.headers['x-school-id'];
  const paramSchoolId = req.params?.schoolId;
  const userSchoolId = (req as any).user?.schoolId;

  if (Array.isArray(headerSchoolId)) {
    return headerSchoolId[0] || paramSchoolId || userSchoolId;
  }

  return (headerSchoolId as string) || paramSchoolId || userSchoolId;
};

/**
 * Ensures request has school context and attaches it to req.schoolContext.
 */
export const requireSchoolContext = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;
  const schoolId = resolveSchoolId(req);

  if (role !== 'SUPER_ADMIN' && !schoolId) {
    return res.status(400).json({ success: false, message: 'School context is required' });
  }

  (req as any).schoolContext = { schoolId: schoolId || null };
  next();
};

/**
 * Ensures URL schoolId does not conflict with authenticated user school scope.
 */
export const enforceSchoolContextConsistency = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;
  const jwtSchoolId = (req as any).user?.schoolId;
  const paramSchoolId = req.params?.schoolId;
  const schoolId = resolveSchoolId(req);

  if (role !== 'SUPER_ADMIN' && jwtSchoolId && paramSchoolId && jwtSchoolId !== paramSchoolId) {
    return res.status(403).json({ success: false, message: 'School scope mismatch' });
  }

  (req as any).schoolContext = { schoolId: schoolId || null };
  next();
};

export const requireSchool = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).schoolContext = (req as any).schoolContext || { schoolId: resolveSchoolId(req) || null };
  next();
};

export const requireBranch = (_req: Request, _res: Response, next: NextFunction) => next();
