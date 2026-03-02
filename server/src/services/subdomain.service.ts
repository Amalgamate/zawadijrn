// REMOVED: Subdomain service — not needed in single-tenant mode
export const subdomainService = {
  validateSubdomain: async () => ({ available: false, message: 'Not supported' }),
  resolveSubdomainToSchool: async () => null,
  updateSchoolSubdomain: async () => null,
  autoAssignSubdomain: async () => '',
  generateSubdomainFromName: () => '',
  buildSubdomainUrl: () => '',
  clearCache: () => {},
  getCacheStats: () => ({ size: 0 }),
};
