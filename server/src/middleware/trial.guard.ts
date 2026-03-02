// REMOVED: Trial guard — not needed in single-tenant mode
import { Request, Response, NextFunction } from 'express';

export const checkSchoolActive = (_req: Request, _res: Response, next: NextFunction) => next();
