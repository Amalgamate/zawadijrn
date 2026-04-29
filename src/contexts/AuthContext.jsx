/**
 * Authentication Context
 * Provides authentication state and user information throughout the app
 * 
 * @module contexts/AuthContext
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';

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

  const normalizeUser = useCallback((u) => {
    if (!u) return u;
    // Don't force PRIMARY_CBC default when the backend has signalled that institution
    // setup is still required (post-reset). The wizard will lock the type and then
    // call updateUser() to patch this value in memory.
    const institutionType = u.requiresInstitutionSetup
      ? (u.institutionType ?? null)
      : (u.institutionType || 'PRIMARY_CBC');
    const activeApps = Array.isArray(u.activeApps) ? u.activeApps : undefined;
    return { ...u, institutionType, activeApps };
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        // Support both real tokens and cookie-based placeholders
        if (storedUser && (token || document.cookie.includes('accessToken'))) {
          const parsedUser = normalizeUser(JSON.parse(storedUser));
          localStorage.setItem('user', JSON.stringify(parsedUser));
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [normalizeUser]);

  const login = useCallback((userData, token, refreshToken) => {
    try {
      const normalizedUser = normalizeUser(userData);

      // Store tokens
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Store user data
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      setUser(normalizedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }, [normalizeUser]);

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken'); // Also clear legacy authToken if present
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
