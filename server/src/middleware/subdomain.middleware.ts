// REMOVED: Subdomain middleware — not needed in single-tenant mode
import { Request, Response, NextFunction } from 'express';

export interface SubdomainRequest extends Request {
  subdomain?: string;
  isTenantAccess?: boolean;
}

export function extractSubdomain(req: SubdomainRequest, _res: Response, next: NextFunction): void {
  req.subdomain = undefined;
  req.isTenantAccess = false;
  next();
}

export function extractPathTenant(_req: SubdomainRequest, _res: Response, next: NextFunction): void {
  next();
}
