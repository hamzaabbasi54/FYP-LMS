import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { renderAsync } from 'docx-preview';
import { MdClose, MdFileDownload, MdDescription, MdPictureAsPdf, MdError } from 'react-icons/md';

const DocumentViewer = () => {
    const [searchParams] = useSearchParams();
    const fileUrl = searchParams.get('url') || '';
    const fileName = searchParams.get('name') || 'Document';
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine file type from name or URL
    const getFileExtension = () => {
        const name = fileName.toLowerCase();
        if (name.endsWith('.pdf')) return 'pdf';
        if (name.endsWith('.docx')) return 'docx';
        if (name.endsWith('.doc')) return 'doc';
        // Fallback: check URL
        const url = fileUrl.toLowerCase();
        if (url.includes('.pdf')) return 'pdf';
        if (url.includes('.docx')) return 'docx';
        if (url.includes('.doc')) return 'doc';
        return 'unknown';
    };

    const fileType = getFileExtension();

    // Render DOCX on mount
    useEffect(() => {
        if (fileType !== 'docx' || !fileUrl) return;

        const loadDocx = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error(`Failed to fetch file (${response.status})`);
                const blob = await response.blob();
                if (containerRef.current) {
                    containerRef.current.innerHTML = '';
                    await renderAsync(blob, containerRef.current, null, {
                        className: 'docx-viewer',
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false,
                        ignoreFonts: false,
                        breakPages: true,
                        useBase64URL: true,
                    });
                }
            } catch (err) {
                console.error('DOCX render error:', err);
                setError(err.message || 'Failed to render document');
            } finally {
                setLoading(false);
            }
        };

        loadDocx();
    }, [fileUrl, fileType]);

    // For PDF, mark loading as done once iframe loads
    useEffect(() => {
        if (fileType === 'pdf') {
            setLoading(false);
        }
    }, [fileType]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClose = () => {
        window.close();
    };

    // Unsupported format (.doc or unknown)
    const isUnsupported = fileType === 'doc' || fileType === 'unknown';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
        }}>
            {/* Header Bar */}
            <header style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                padding: '0 24px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                {/* File Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: fileType === 'pdf'
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        boxShadow: fileType === 'pdf'
                            ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                            : '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}>
                        {fileType === 'pdf' ? (
                            <MdPictureAsPdf style={{ color: '#fff', fontSize: '20px' }} />
                        ) : (
                            <MdDescription style={{ color: '#fff', fontSize: '20px' }} />
                        )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <h1 style={{
                            color: '#f1f5f9',
                            fontSize: '14px',
                            fontWeight: 600,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '400px'
                        }}>
                            {fileName}
                        </h1>
                        <p style={{
                            color: '#64748b',
                            fontSize: '11px',
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: 500
                        }}>
                            {fileType.toUpperCase()} Document
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'; }}
                    >
                        <MdFileDownload style={{ fontSize: '16px' }} />
                        Download
                    </button>
                    <button
                        onClick={handleClose}
                        title="Close"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            background: 'rgba(148, 163, 184, 0.1)',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)'; }}
                    >
                        <MdClose style={{ fontSize: '18px' }} />
                    </button>
                </div>
            </header>

            {/* Document Body */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Loading State */}
                {loading && fileType === 'docx' && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(59, 130, 246, 0.2)',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'docSpin 0.8s linear infinite'
                        }} />
                        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
                            Rendering document...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        padding: '32px'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <MdError style={{ fontSize: '32px', color: '#ef4444' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
                                Failed to Load Document
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px', maxWidth: '400px' }}>
                                {error}
                            </p>
                            <button
                                onClick={handleDownload}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <MdFileDownload style={{ fontSize: '18px' }} />
                                Download Instead
                            </button>
                        </div>
                    </div>
                )}

                {/* Unsupported Format (.doc) */}
                {isUnsupported && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        padding: '32px'
                    }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <MdDescription style={{ fontSize: '36px', color: '#f59e0b' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
                                Preview Not Available
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px', maxWidth: '420px', lineHeight: 1.6 }}>
                                {fileType === 'doc'
                                    ? 'The legacy .doc format cannot be previewed in the browser. Please download the file to view it in Microsoft Word.'
                                    : 'This file format is not supported for in-browser preview. Please download the file to view it.'}
                            </p>
                            <button
                                onClick={handleDownload}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <MdFileDownload style={{ fontSize: '20px' }} />
                                Download File
                            </button>
                        </div>
                    </div>
                )}

                {/* PDF Viewer */}
                {fileType === 'pdf' && !error && (
                    <iframe
                        src={fileUrl}
                        title={fileName}
                        style={{
                            flex: 1,
                            width: '100%',
                            border: 'none',
                            background: '#1e293b'
                        }}
                    />
                )}

                {/* DOCX Rendered Container */}
                {fileType === 'docx' && !error && (
                    <div
                        ref={containerRef}
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            background: '#334155',
                            padding: loading ? 0 : '24px',
                            display: loading ? 'none' : 'block'
                        }}
                    />
                )}
            </main>

            {/* Spinner animation + DOCX viewer styles */}
            <style>{`
                @keyframes docSpin {
                    to { transform: rotate(360deg); }
                }
                .docx-viewer {
                    max-width: 900px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }
                .docx-viewer section.docx {
                    padding: 48px 60px !important;
                    min-height: 100%;
                }
                .docx-wrapper {
                    background: #334155 !important;
                    padding: 0 !important;
                }
                .docx-wrapper > section.docx {
                    margin: 0 auto !important;
                    max-width: 900px !important;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3) !important;
                    border-radius: 8px !important;
                    margin-bottom: 24px !important;
                }
            `}</style>
        </div>
    );
};

export default DocumentViewer;
