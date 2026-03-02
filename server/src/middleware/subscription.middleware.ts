// REMOVED: Subscription enforcement — not needed in single-tenant mode
export const requireActiveSubscription = (_req: any, _res: any, next: any) => next();
export const requireFeature = (_feature: string) => (_req: any, _res: any, next: any) => next();
export const checkBranchLimit = (_req: any, _res: any, next: any) => next();
export async function getSchoolSubscription(_schoolId: string) { return null; }
export async function isSubscriptionExpiringSoon(_schoolId: string) { return { expiringSoon: false, daysRemaining: 9999 }; }
