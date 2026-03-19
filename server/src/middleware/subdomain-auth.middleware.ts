export async function subdomainAuth(_req: any, _res: any, next: any): Promise<void> {
  next();
}

export function requireSubdomainAccess(_req: any, _res: any, next: any): void {
  next();
}

export async function ensureSchoolContext(_req: any, _res: any, next: any): Promise<void> {
  next();
}

export function getSchoolContextFromRequest(_req: any): null {
  return null;
}

export function getSubdomainSchoolFromRequest(_req: any): null {
  return null;
}
