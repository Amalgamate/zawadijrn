import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useUIStore
 * Manages global UI state: navigation, sidebar, layout preferences, and in-app history.
 */
export const useUIStore = create(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: 'dashboard',
      pageParams: {},

      // In-app history stack (not persisted — rebuilt each session)
      historyStack: ['dashboard'],
      historyIndex: 0,

      // Sidebar
      // Desktop: expanded by default; user can collapse.
      sidebarOpen: true,

      // Actions
      setCurrentPage: (page, params = {}) => set((state) => {
        // Trim forward entries if we navigated after going back
        const baseStack = state.historyStack.slice(0, state.historyIndex + 1);
        // Avoid duplicate consecutive entries
        const lastPage = baseStack[baseStack.length - 1];
        const newStack = lastPage === page ? baseStack : [...baseStack, page];
        const newIndex = newStack.length - 1;
        return {
          currentPage: page,
          pageParams: params,
          historyStack: newStack,
          historyIndex: newIndex,
        };
      }),

      goBack: () => set((state) => {
        if (state.historyIndex <= 0) return state; // Already at root — do nothing
        const newIndex = state.historyIndex - 1;
        return {
          currentPage: state.historyStack[newIndex],
          pageParams: {},
          historyIndex: newIndex,
        };
      }),

      goForward: () => set((state) => {
        if (state.historyIndex >= state.historyStack.length - 1) return state;
        const newIndex = state.historyIndex + 1;
        return {
          currentPage: state.historyStack[newIndex],
          pageParams: {},
          historyIndex: newIndex,
        };
      }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      resetUI: () => set({
        currentPage: 'dashboard',
        pageParams: {},
        historyStack: ['dashboard'],
        historyIndex: 0,
        sidebarOpen: true
      })
    }),
    {
      name: 'cbc_ui_state',
      partialize: (state) => ({
        // Persist visual prefs only — never persist the history stack
        currentPage: state.currentPage,
        pageParams: state.pageParams,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

