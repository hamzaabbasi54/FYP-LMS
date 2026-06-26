// ============================================
// File: frontend/src/components/common/UndoToast.jsx
// Floating toast rendered via portal at app root.
// Shows countdown + undo button for each pending deletion.
// ============================================

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdUndo, MdClose, MdDeleteForever } from 'react-icons/md';
import useUndoStore from '../../stores/useUndoStore';

const UndoToastItem = ({ item }) => {
    const undo = useUndoStore(s => s.undo);
    const [remainingMs, setRemainingMs] = useState(
        Math.max(0, item.timeout - (Date.now() - item.createdAt))
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const left = Math.max(0, item.timeout - (Date.now() - item.createdAt));
            setRemainingMs(left);
            if (left <= 0) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }, [item.createdAt, item.timeout]);

    const progress = remainingMs / item.timeout;
    const secondsLeft = Math.ceil(remainingMs / 1000);

    return (
        <div
            style={{
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '320px',
                maxWidth: '480px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'undoSlideIn 0.3s ease-out'
            }}
        >
            {/* Progress bar */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    width: `${progress * 100}%`,
                    background: item.highRisk
                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                        : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                    transition: 'width 0.1s linear',
                    borderRadius: '0 0 12px 12px'
                }}
            />

            {/* Icon */}
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: item.highRisk ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <MdDeleteForever style={{
                    fontSize: '20px',
                    color: item.highRisk ? '#f87171' : '#60a5fa'
                }} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
                    {item.type} deleted
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {item.label} • {secondsLeft}s to undo
                </div>
            </div>

            {/* Undo button */}
            <button
                onClick={() => undo(item.id)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(59,130,246,0.2)',
                    color: '#60a5fa',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    flexShrink: 0
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(59,130,246,0.35)'}
                onMouseLeave={e => e.target.style.background = 'rgba(59,130,246,0.2)'}
            >
                <MdUndo style={{ fontSize: '16px' }} />
                Undo
            </button>
        </div>
    );
};

const UndoToast = () => {
    const pendingDeletions = useUndoStore(s => s.pendingDeletions);

    if (pendingDeletions.length === 0) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: '80px',
                right: '24px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                pointerEvents: 'auto'
            }}
        >
            {pendingDeletions.map(item => (
                <UndoToastItem key={item.id} item={item} />
            ))}
            <style>{`
                @keyframes undoSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default UndoToast;
