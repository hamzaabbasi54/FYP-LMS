// ============================================
// File: frontend/src/components/common/UnsavedBanner.jsx
// Inline banner showing "You have unsaved changes"
// with Save and Discard buttons. Plugs into useDraftStore.
// ============================================

import React from 'react';
import { MdWarning, MdSave, MdClose } from 'react-icons/md';

const UnsavedBanner = ({ onSave, onDiscard, saving = false }) => {
    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                border: '1px solid #f59e0b',
                borderRadius: '10px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                animation: 'unsavedPulse 2s ease-in-out infinite'
            }}
        >
            <MdWarning style={{ fontSize: '20px', color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#92400e', flex: 1 }}>
                You have unsaved changes
            </span>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                    onClick={onSave}
                    disabled={saving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#d97706',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        transition: 'background 0.15s'
                    }}
                >
                    <MdSave style={{ fontSize: '14px' }} />
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={onDiscard}
                    disabled={saving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d97706',
                        background: 'transparent',
                        color: '#92400e',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                    }}
                >
                    <MdClose style={{ fontSize: '14px' }} />
                    Discard
                </button>
            </div>
            <style>{`
                @keyframes unsavedPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.2); }
                    50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1); }
                }
            `}</style>
        </div>
    );
};

export default UnsavedBanner;
