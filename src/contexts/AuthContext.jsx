/**
 * Authentication Context
 * Provides authentication state and user information throughout the app
 * 
 * @module contexts/AuthContext
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { clearAdminSchoolId, clearBranchId, clearPortalSchoolId } from '../services/tenantContext';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => { },
  logout: () => { },
  updateUser: () => { },
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Ensure currentSchoolId is set if user has a school
          const schoolId = parsedUser.schoolId || (parsedUser.school && parsedUser.school.id);
          if (schoolId && !localStorage.getItem('currentSchoolId')) {
            localStorage.setItem('currentSchoolId', schoolId);
          }
          // Note: Super Admins can have currentSchoolId when they use the school switcher
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentSchoolId');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback((userData, token, refreshToken) => {
    try {
      // Store tokens
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));

      // Store current school ID for easy access
      const schoolId = userData.schoolId || (userData.school && userData.school.id);
      if (schoolId) {
        localStorage.setItem('currentSchoolId', schoolId);
      }
      // Note: Super Admins can switch schools using the school switcher

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken'); // Also clear legacy authToken if present
    clearAdminSchoolId();
    clearPortalSchoolId();
    clearBranchId();

    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const value = React.useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
  }), [isAuthenticated, user, loading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
