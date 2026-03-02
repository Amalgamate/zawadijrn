/**
 * Permission-Based Component Wrapper
 * Conditionally renders components based on user permissions
 * 
 * @module components/common/Can
 */

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Can Component - Shows children only if user has permission
 * 
 * @param {Object} props
 * @param {string} props.permission - Required permission
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {React.ReactNode} [props.fallback=null] - Content to show if not authorized
 * 
 * @example
 * <Can permission="CREATE_LEARNER">
 *   <button>Add Student</button>
 * </Can>
 */
export const Can = ({ permission, children, fallback = null }) => {
  const { can } = usePermissions();
  
  if (can(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * CanAny Component - Shows children if user has ANY of the permissions
 * 
 * @param {Object} props
 * @param {string[]} props.permissions - Array of permissions (needs at least one)
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {React.ReactNode} [props.fallback=null] - Content to show if not authorized
 * 
 * @example
 * <CanAny permissions={['VIEW_ALL_REPORTS', 'VIEW_OWN_REPORTS']}>
 *   <ReportsSection />
 * </CanAny>
 */
export const CanAny = ({ permissions, children, fallback = null }) => {
  const { canAny } = usePermissions();
  
  if (canAny(permissions)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * CanAll Component - Shows children only if user has ALL permissions
 * 
 * @param {Object} props
 * @param {string[]} props.permissions - Array of permissions (needs all)
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {React.ReactNode} [props.fallback=null] - Content to show if not authorized
 * 
 * @example
 * <CanAll permissions={['EDIT_USER', 'DELETE_USER']}>
 *   <AdminPanel />
 * </CanAll>
 */
export const CanAll = ({ permissions, children, fallback = null }) => {
  const { canAll } = usePermissions();
  
  if (canAll(permissions)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * IsRole Component - Shows children only if user has specific role
 * 
 * @param {Object} props
 * @param {string} props.role - Required role
 * @param {React.ReactNode} props.children - Content to render if role matches
 * @param {React.ReactNode} [props.fallback=null] - Content to show if role doesn't match
 * 
 * @example
 * <IsRole role="SUPER_ADMIN">
 *   <SystemSettings />
 * </IsRole>
 */
export const IsRole = ({ role, children, fallback = null }) => {
  const { isRole } = usePermissions();
  
  if (isRole(role)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * IsAnyRole Component - Shows children if user has ANY of the specified roles
 * 
 * @param {Object} props
 * @param {string[]} props.roles - Array of roles
 * @param {React.ReactNode} props.children - Content to render if role matches
 * @param {React.ReactNode} [props.fallback=null] - Content to show if no roles match
 * 
 * @example
 * <IsAnyRole roles={['SUPER_ADMIN', 'ADMIN']}>
 *   <SettingsMenu />
 * </IsAnyRole>
 */
export const IsAnyRole = ({ roles, children, fallback = null }) => {
  const { isAnyRole } = usePermissions();
  
  if (isAnyRole(roles)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * CanNot Component - Shows children only if user DOES NOT have permission
 * Useful for showing upgrade prompts or alternative content
 * 
 * @param {Object} props
 * @param {string} props.permission - Permission to check against
 * @param {React.ReactNode} props.children - Content to render if NOT authorized
 * @param {React.ReactNode} [props.fallback=null] - Content to show if authorized
 * 
 * @example
 * <CanNot permission="ACCESS_PREMIUM_FEATURES">
 *   <UpgradePrompt />
 * </CanNot>
 */
export const CanNot = ({ permission, children, fallback = null }) => {
  const { can } = usePermissions();
  
  if (!can(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};
