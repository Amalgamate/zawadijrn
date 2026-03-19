import { Request, Response, NextFunction } from 'express';

export interface SubdomainRequest extends Request {}

export function extractSubdomain(_req: SubdomainRequest, _res: Response, next: NextFunction): void {
  next();
}

export function extractPathTenant(_req: SubdomainRequest, _res: Response, next: NextFunction): void {
  next();
}
