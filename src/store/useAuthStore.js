import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useAuthStore
 * Manages authentication state and current user info
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      institutionType: 'PRIMARY_CBC',
      
      // Actions
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: !!user,
        institutionType: user?.institutionType || 'PRIMARY_CBC'
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      logout: () => {
        // Clear tokens from localStorage manually if needed for security, 
        // though Zustand persist will clear the state.
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }),
    {
      name: 'cbc_auth_state',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
