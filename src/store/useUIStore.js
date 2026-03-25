import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useUIStore
 * Manages global UI state: navigation, sidebar, and layout preferences
 */
export const useUIStore = create(
  persist(
    (set) => ({
      // Navigation
      currentPage: 'dashboard',
      pageParams: {},
      
      // Sidebar
      sidebarOpen: false,
      expandedSections: {
        dashboard: true,
        learners: false,
        teachers: false,
        attendance: false,
        communications: false,
        assessment: false,
        'learning-hub': false,
        finance: false,
        settings: false
      },

      // Actions
      setCurrentPage: (page, params = {}) => set({ 
        currentPage: page, 
        pageParams: params 
      }),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleSection: (section) => set((state) => {
        const isOpening = !state.expandedSections[section];
        if (isOpening) {
          // Accordion logic: Close all other sections
          const newState = Object.keys(state.expandedSections).reduce((acc, key) => {
            acc[key] = false;
            return acc;
          }, {});
          newState[section] = true;
          return { expandedSections: newState };
        } else {
          // Just toggling off
          return {
            expandedSections: {
              ...state.expandedSections,
              [section]: false
            }
          };
        }
      }),
      
      resetUI: () => set({
        currentPage: 'dashboard',
        pageParams: {},
        sidebarOpen: false
      })
    }),
    {
      name: 'cbc_ui_state', // Key in localStorage
      partialize: (state) => ({ 
        currentPage: state.currentPage, 
        pageParams: state.pageParams,
        sidebarOpen: state.sidebarOpen,
        expandedSections: state.expandedSections
      }),
    }
  )
);
