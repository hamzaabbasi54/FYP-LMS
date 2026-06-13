import React, { useRef, useState, useEffect } from 'react';
import { MdSearch, MdPeople, MdEmail, MdPhone, MdSchool, MdFileUpload, MdFileDownload, MdPersonAdd, MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { parentApi } from '../../services/api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const Parents = () => {
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Data & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data, isLoading: loading } = useQuery({
        queryKey: ['parents', page, debouncedSearch],
        queryFn: async () => {
            const params = { page, limit: 12 };
            if (debouncedSearch) params.search = debouncedSearch;
            
            const response = await parentApi.getAll(params);
            if (response.success) {
                return {
                    parents: response.data || [],
                    totalPages: response.pagination?.totalPages || 1,
                    total: response.pagination?.total || 0
                };
            }
            throw new Error('Failed to load parents');
        },
        placeholderData: keepPreviousData
    });

    const parents = data?.parents || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            alert(`File "${file.name}" selected. Import functionality coming soon.`);
        }
        e.target.value = '';
    };

    const [newParent, setNewParent] = useState({
        parentName: '', email: '', phone: '', studentName: '', studentId: ''
    });

    const handleAddParent = (e) => {
        e.preventDefault();
        alert(`Parent "${newParent.parentName}" added successfully!`);
        setShowAddModal(false);
        setNewParent({ parentName: '', email: '', phone: '', studentName: '', studentId: '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Parents Directory
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Manage parent information and contacts</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />

                        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium shadow-sm transition-colors text-sm">
                            <MdPersonAdd className="w-4 h-4" /> Add
                        </button>
                        <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm">
                            <MdFileUpload className="w-4 h-4" /> Import
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm">
                            <MdFileDownload className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, student ID, or email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1); // Reset page on search
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                        <MdPeople className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">
                            Total: {loading ? '...' : total}
                        </span>
                    </div>
                </div>

                {/* Parents Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400">Loading parents...</p>
                    </div>
                ) : parents.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-400">No parents found matching your search</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                            {parents.map((parent) => (
                                <div key={parent.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <MdSchool className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{parent.studentName}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{parent.studentId}</p>
                                        </div>
                                    </div>

                                    {/* Parent Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                            <span className="text-blue-700 font-bold text-sm">
                                                {(parent.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{parent.name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Parent/Guardian</p>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-2.5">
                                        <a
                                            href={`mailto:${parent.email || ''}`}
                                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                                        >
                                            <MdEmail className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{parent.email || 'No email provided'}</span>
                                        </a>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <MdPhone className="w-4 h-4 flex-shrink-0" />
                                            <span>{parent.phone || 'No phone provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MdChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-slate-600 px-4">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MdChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-lg font-semibold text-slate-800">Add New Parent</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddParent} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                                    <input type="text" required value={newParent.studentName} onChange={(e) => setNewParent({ ...newParent, studentName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" placeholder="Enter student name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                                    <input type="text" required value={newParent.studentId} onChange={(e) => setNewParent({ ...newParent, studentId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" placeholder="U2024XXX" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Parent Name</label>
                                    <input type="text" required value={newParent.parentName} onChange={(e) => setNewParent({ ...newParent, parentName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" placeholder="Enter parent name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" required value={newParent.email} onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" placeholder="parent@email.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="tel" value={newParent.phone} onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" placeholder="+1 XXX-XXX-XXXX" />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium">
                                        Add Parent
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Parents;
