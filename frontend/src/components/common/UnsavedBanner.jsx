// ============================================
// File: frontend/src/components/common/UnsavedBanner.jsx
// Inline banner showing "You have unsaved changes"
// with Save and Discard buttons. Plugs into useDraftStore.
// ============================================

import React from 'react';
import { MdInfoOutline, MdSave, MdClose } from 'react-icons/md';

const UnsavedBanner = ({ onSave, onDiscard, saving = false }) => {
    return (
        <div className="mb-4 flex flex-col gap-3 rounded-[8px] border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-3 shadow-sm sm:flex-row sm:items-center sm:px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-sky-200 bg-white text-sky-700">
                <MdInfoOutline className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-sky-900">
                You have unsaved changes
            </span>
            <div className="flex shrink-0 gap-2">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0798e7] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0078c5] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                    <MdSave style={{ fontSize: '14px' }} />
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={onDiscard}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                    <MdClose style={{ fontSize: '14px' }} />
                    Discard
                </button>
            </div>
        </div>
    );
};

export default UnsavedBanner;
