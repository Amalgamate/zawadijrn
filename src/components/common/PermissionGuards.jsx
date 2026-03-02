/**
 * Permission-Based Components
 * Components for conditional rendering based on permissions and roles
 * 
 * @module components/common/PermissionGuards
 */

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Renders children only if user has the specified permission
 * 
 * @param {Object} props
 * @param {string} props.permission - Permission name to check
 * @param {React.ReactNode} props.children - Content to render if permitted
 * @param {React.ReactNode} [props.fallback=null] - Content to render if not permitted
 * 
 * @example
 * <Can permission="CREATE_LEARNER">
 *   <button>Add Learner</button>
 * </Can>
 */
export const Can = ({ permission, children, fallback = null }) => {
  const { can } = usePermissions();
  
  return can(permission) ? <>{children}</> : fallback;
};

/**
 * Renders children only if user has ANY of the specified permissions
 * 
 * @param {Object} props
 * @param {string[]} props.permissions - Array of permissions
 * @param {React.ReactNode} props.children - Content to render if permitted
 * @param {React.ReactNode} [props.fallback=null] - Content to render if not permitted
 * 
 * @example
 * <CanAny permissions={['VIEW_ALL_REPORTS', 'VIEW_OWN_REPORTS']}>
 *   <ReportsPage />
 * </CanAny>
 */
export const CanAny = ({ permissions, children, fallback = null }) => {
  const { canAny } = usePermissions();
  
  return canAny(permissions) ? <>{children}</> : fallback;
};

/**
 * Renders children only if user has ALL of the specified permissions
 * 
 * @param {Object} props
 * @param {string[]} props.permissions - Array of permissions
 * @param {React.ReactNode} props.children - Content to render if permitted
 * @param {React.ReactNode} [props.fallback=null] - Content to render if not permitted
 * 
 * @example
 * <CanAll permissions={['CREATE_LEARNER', 'EDIT_LEARNER']}>
 *   <LearnerManagement />
 * </CanAll>
 */
export const CanAll = ({ permissions, children, fallback = null }) => {
  const { canAll } = usePermissions();
  
  return canAll(permissions) ? <>{children}</> : fallback;
};

/**
 * Renders children only if user has the specified role
 * 
 * @param {Object} props
 * @param {string} props.role - Role name to check
 * @param {React.ReactNode} props.children - Content to render if role matches
 * @param {React.ReactNode} [props.fallback=null] - Content to render if role doesn't match
 * 
 * @example
 * <IsRole role="PARENT">
 *   <ParentDashboard />
 * </IsRole>
 */
export const IsRole = ({ role, children, fallback = null }) => {
  const { isRole } = usePermissions();
  
  return isRole(role) ? <>{children}</> : fallback;
};

/**
 * Renders children only if user has ANY of the specified roles
 * 
 * @param {Object} props
 * @param {string[]} props.roles - Array of roles
 * @param {React.ReactNode} props.children - Content to render if role matches
 * @param {React.ReactNode} [props.fallback=null] - Content to render if role doesn't match
 * 
 * @example
 * <IsAnyRole roles={['SUPER_ADMIN', 'ADMIN']}>
 *   <AdminSettings />
 * </IsAnyRole>
 */
export const IsAnyRole = ({ roles, children, fallback = null }) => {
  const { isAnyRole } = usePermissions();
  
  return isAnyRole(roles) ? <>{children}</> : fallback;
};

/**
 * Inverse of Can - renders children only if user DOES NOT have permission
 * 
 * @param {Object} props
 * @param {string} props.permission - Permission name to check
 * @param {React.ReactNode} props.children - Content to render if NOT permitted
 * @param {React.ReactNode} [props.fallback=null] - Content to render if permitted
 * 
 * @example
 * <Cannot permission="SYSTEM_SETTINGS">
 *   <div>You don't have access to system settings</div>
 * </Cannot>
 */
export const Cannot = ({ permission, children, fallback = null }) => {
  const { can } = usePermissions();
  
  return !can(permission) ? <>{children}</> : fallback;
};

/**
 * Inverse of IsRole - renders children only if user DOES NOT have role
 * 
 * @param {Object} props
 * @param {string} props.role - Role name to check
 * @param {React.ReactNode} props.children - Content to render if role doesn't match
 * @param {React.ReactNode} [props.fallback=null] - Content to render if role matches
 * 
 * @example
 * <IsNotRole role="PARENT">
 *   <StaffOnlySection />
 * </IsNotRole>
 */
export const IsNotRole = ({ role, children, fallback = null }) => {
  const { isRole } = usePermissions();
  
  return !isRole(role) ? <>{children}</> : fallback;
};

/**
 * Higher-order component that wraps a component with permission check
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {string} permission - Permission required
 * @returns {React.Component} Wrapped component
 * 
 * @example
 * const ProtectedButton = withPermission(Button, 'CREATE_LEARNER');
 */
export const withPermission = (Component, permission) => {
  return (props) => {
    const { can } = usePermissions();
    
    if (!can(permission)) {
      return null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Higher-order component that wraps a component with role check
 * 
 * @param {React.Component} Component - Component to wrap
 * @param {string|string[]} roles - Role(s) required
 * @returns {React.Component} Wrapped component
 * 
 * @example
 * const AdminDashboard = withRole(Dashboard, 'SUPER_ADMIN');
 * const StaffDashboard = withRole(Dashboard, ['ADMIN', 'TEACHER']);
 */
export const withRole = (Component, roles) => {
  return (props) => {
    const { isRole, isAnyRole } = usePermissions();
    
    const hasRole = Array.isArray(roles) 
      ? isAnyRole(roles)
      : isRole(roles);
    
    if (!hasRole) {
      return null;
    }
    
    return <Component {...props} />;
  };
};
