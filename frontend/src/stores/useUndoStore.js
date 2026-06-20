// ============================================
// File: frontend/src/stores/useUndoStore.js
// Zustand store for managing undo-able deletions
// Provides a timed undo queue — the actual API call
// is deferred until the timer expires.
// ============================================

import { create } from 'zustand';

const UNDO_TIMEOUT_DEFAULT = 5000;  // 5 seconds for normal deletions
const UNDO_TIMEOUT_HIGH_RISK = 8000; // 8 seconds for batch/student/department

const useUndoStore = create((set, get) => ({
    // Queue of pending deletions: { id, type, label, apiCall, timer, highRisk }
    pendingDeletions: [],

    /**
     * Enqueue a deletion with an undo window.
     * @param {Object} params
     * @param {string} params.id         - Unique key for this deletion (e.g. "batch-5")
     * @param {string} params.type       - Category label (e.g. "Batch", "Student", "Course")
     * @param {string} params.label      - Human-readable name (e.g. "CS-2024")
     * @param {Function} params.apiCall  - The actual delete function to call (async)
     * @param {Function} [params.onUndo] - Optional callback when undo is triggered (re-fetch, etc.)
     * @param {boolean} [params.highRisk] - If true, uses the longer timer
     */
    enqueue: ({ id, type, label, apiCall, onUndo, highRisk = false }) => {
        const { pendingDeletions } = get();

        // Prevent duplicate entries for the same id
        if (pendingDeletions.find(p => p.id === id)) return;

        const timeout = highRisk ? UNDO_TIMEOUT_HIGH_RISK : UNDO_TIMEOUT_DEFAULT;
        const createdAt = Date.now();

        const timer = setTimeout(async () => {
            // Timer expired — execute the real API call
            try {
                await apiCall();
            } catch (err) {
                console.error(`[UndoStore] Failed to execute deletion for ${id}:`, err);
            }
            // Remove from queue regardless of success/failure
            set(state => ({
                pendingDeletions: state.pendingDeletions.filter(p => p.id !== id)
            }));
        }, timeout);

        set(state => ({
            pendingDeletions: [
                ...state.pendingDeletions,
                { id, type, label, timer, onUndo, highRisk, createdAt, timeout }
            ]
        }));
    },

    /**
     * Undo a pending deletion — cancel the timer, remove from queue, run onUndo callback.
     */
    undo: (id) => {
        const { pendingDeletions } = get();
        const item = pendingDeletions.find(p => p.id === id);
        if (!item) return;

        clearTimeout(item.timer);

        set(state => ({
            pendingDeletions: state.pendingDeletions.filter(p => p.id !== id)
        }));

        // Run the onUndo callback (e.g. re-insert into React Query cache, refetch)
        if (item.onUndo) {
            item.onUndo();
        }
    },

    /**
     * Force-execute a pending deletion immediately (skip the timer).
     */
    executeNow: async (id) => {
        const { pendingDeletions } = get();
        const item = pendingDeletions.find(p => p.id === id);
        if (!item) return;

        clearTimeout(item.timer);

        try {
            await item.apiCall();
        } catch (err) {
            console.error(`[UndoStore] Failed to execute deletion for ${id}:`, err);
        }

        set(state => ({
            pendingDeletions: state.pendingDeletions.filter(p => p.id !== id)
        }));
    },

    /**
     * Cancel all pending deletions (e.g. on logout or page unload).
     */
    cancelAll: () => {
        const { pendingDeletions } = get();
        pendingDeletions.forEach(p => clearTimeout(p.timer));
        set({ pendingDeletions: [] });
    },

    /**
     * Check if a specific item is pending deletion.
     */
    isPending: (id) => {
        return get().pendingDeletions.some(p => p.id === id);
    }
}));

export default useUndoStore;
