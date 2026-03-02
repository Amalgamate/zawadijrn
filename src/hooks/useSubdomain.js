/**
 * useSubdomain Hook (Deprecated - Multi-tenant cleanup)
 * Stub hook to maintain compatibility during migration away from multi-tenancy
 */

export const useSubdomainCheck = () => {
  return {
    subdomain: null,
    isLoading: false,
    error: null,
  };
};

export default useSubdomainCheck;
