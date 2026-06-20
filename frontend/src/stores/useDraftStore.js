// ============================================
// File: frontend/src/stores/useDraftStore.js
// Zustand store with localStorage persistence
// for tracking unsaved changes (schedule, CLO-PLO mappings)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useDraftStore = create(
    persist(
        (set, get) => ({
            // Drafts keyed by "type:batchId:courseId"
            // e.g. "schedule:5:12" => { schedule state object }
            drafts: {},

            /**
             * Save a draft for a given key.
             * @param {string} key - Unique key like "schedule:5:12"
             * @param {*} data - The draft data to store
             */
            saveDraft: (key, data) => {
                set(state => ({
                    drafts: {
                        ...state.drafts,
                        [key]: {
                            data,
                            savedAt: Date.now()
                        }
                    }
                }));
            },

            /**
             * Get a draft by key. Returns null if not found.
             */
            getDraft: (key) => {
                const draft = get().drafts[key];
                return draft ? draft.data : null;
            },

            /**
             * Check if a draft exists for the given key.
             */
            hasDraft: (key) => {
                return !!get().drafts[key];
            },

            /**
             * Get the timestamp of when the draft was saved.
             */
            getDraftAge: (key) => {
                const draft = get().drafts[key];
                if (!draft) return null;
                return Date.now() - draft.savedAt;
            },

            /**
             * Clear a specific draft (e.g. after a successful save).
             */
            clearDraft: (key) => {
                set(state => {
                    const newDrafts = { ...state.drafts };
                    delete newDrafts[key];
                    return { drafts: newDrafts };
                });
            },

            /**
             * Clear all drafts.
             */
            clearAllDrafts: () => {
                set({ drafts: {} });
            }
        }),
        {
            name: 'lms-drafts', // localStorage key
            partialize: (state) => ({ drafts: state.drafts }) // only persist drafts
        }
    )
);

export default useDraftStore;
