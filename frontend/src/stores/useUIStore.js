// ============================================
// File: frontend/src/stores/useUIStore.js
// Zustand store with localStorage persistence
// for admin UI preferences (sidebar, tabs, etc.)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
    persist(
        (set) => ({
            // Sidebar state
            sidebarCollapsed: false,
            toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

            // Tab memory: { pageKey: activeTabIndex }
            // e.g. { "batchCourseSchedule:5:12": 0 }
            activeTabs: {},
            setActiveTab: (pageKey, tabIndex) =>
                set(state => ({
                    activeTabs: { ...state.activeTabs, [pageKey]: tabIndex }
                })),
            getActiveTab: (pageKey) => {
                // This is accessed via get() from the component
            },

            // Last selected semester per batch detail page
            lastSemester: {},
            setLastSemester: (batchId, semNum) =>
                set(state => ({
                    lastSemester: { ...state.lastSemester, [batchId]: semNum }
                }))
        }),
        {
            name: 'lms-ui-prefs', // localStorage key
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                activeTabs: state.activeTabs,
                lastSemester: state.lastSemester
            })
        }
    )
);

export default useUIStore;
