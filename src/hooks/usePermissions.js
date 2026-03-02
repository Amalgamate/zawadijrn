/**
 * usePermissions Hook
 * Provides permission checking functionality based on user role
 * 
 * @module hooks/usePermissions
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageRole,
  getRolePermissions,
  ROLE_HIERARCHY,
  ROLES,
} from '../config/permissions';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  // Memoize permission checks to avoid recalculation
  const permissions = useMemo(() => {
    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission name
     * @returns {boolean}
     */
    const can = (permission) => {
      if (!userRole) return false;
      return hasPermission(userRole, permission);
    };

    /**
     * Check if user has any of the provided permissions
     * @param {string[]} permissionsList - Array of permissions
     * @returns {boolean}
     */
    const canAny = (permissionsList) => {
      if (!userRole) return false;
      return hasAnyPermission(userRole, permissionsList);
    };

    /**
     * Check if user has all of the provided permissions
     * @param {string[]} permissionsList - Array of permissions
     * @returns {boolean}
     */
    const canAll = (permissionsList) => {
      if (!userRole) return false;
      return hasAllPermissions(userRole, permissionsList);
    };

    /**
     * Check if user has a specific role
     * @param {string} role - Role name
     * @returns {boolean}
     */
    const isRole = (role) => {
      return userRole === role;
    };

    /**
     * Check if user has any of the provided roles
     * @param {string[]} rolesList - Array of roles
     * @returns {boolean}
     */
    const isAnyRole = (rolesList) => {
      if (!userRole) return false;
      return rolesList.includes(userRole);
    };

    /**
     * Check if user can manage another role
     * @param {string} targetRole - Role to check against
     * @returns {boolean}
     */
    const canManage = (targetRole) => {
      if (!userRole) return false;
      return canManageRole(userRole, targetRole);
    };

    /**
     * Get all permissions for current user's role
     * @returns {string[]}
     */
    const getAllPermissions = () => {
      if (!userRole) return [];
      return getRolePermissions(userRole);
    };

    /**
     * Get user's role hierarchy level
     * @returns {number}
     */
    const getHierarchyLevel = () => {
      if (!userRole) return 0;
      return ROLE_HIERARCHY[userRole] || 0;
    };

    return {
      can,
      canAny,
      canAll,
      isRole,
      isAnyRole,
      canManage,
      getAllPermissions,
      getHierarchyLevel,
      role: userRole,
      ROLES,
    };
  }, [userRole]);

  return permissions;
};
