/**
 * Protected Route Component
 * Route guard for permission-based navigation
 * 
 * @module components/common/ProtectedRoute
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Protected Route - Requires authentication and optionally permission/role
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string} [props.permission] - Required permission
 * @param {string|string[]} [props.roles] - Required role(s)
 * @param {string} [props.redirectTo='/'] - Where to redirect if unauthorized
 * @param {React.ReactNode} [props.fallback] - Custom unauthorized component
 * 
 * @example
 * // Requires authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * // Requires specific permission
 * <ProtectedRoute permission="CREATE_LEARNER">
 *   <AddLearner />
 * </ProtectedRoute>
 * 
 * // Requires specific role
 * <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
 *   <Settings />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ 
  children, 
  permission, 
  roles,
  redirectTo = '/',
  fallback 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const { can, isRole, isAnyRole } = usePermissions();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permission if specified
  if (permission && !can(permission)) {
    if (fallback) return fallback;
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check role if specified
  if (roles) {
    const hasRequiredRole = Array.isArray(roles)
      ? isAnyRole(roles)
      : isRole(roles);

    if (!hasRequiredRole) {
      if (fallback) return fallback;
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is restricted to specific roles.</p>
            <button 
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Authorized - render children
  return <>{children}</>;
};
