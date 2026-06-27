import React, { useRef, useState, useEffect } from 'react';
import {
    PiCaretLeft,
    PiCaretRight,
    PiDownloadSimple,
    PiEnvelopeSimple,
    PiMagnifyingGlass,
    PiPhone,
    PiStudent,
    PiUploadSimple,
    PiUserCircle,
    PiUserPlus,
    PiUsersThree,
    PiX
} from 'react-icons/pi';
import { parentApi } from '../../services/api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const Parents = () => {
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
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
        placeholderData: keepPreviousData,
        staleTime: Infinity
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
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:p-7">
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-950">Parents Directory</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Manage parent contacts connected to student records.</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />
                            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md">
                                <PiUserPlus className="h-5 w-5" /> Add
                            </button>
                            <button onClick={handleImportClick} className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50">
                                <PiUploadSimple className="h-5 w-5" /> Import
                            </button>
                            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50">
                                <PiDownloadSimple className="h-5 w-5" /> Export
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiUsersThree className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Total: {loading ? '...' : total}</p>
                                <p className="text-xs text-slate-500">Search parent and student contacts</p>
                            </div>
                        </div>
                        <div className="relative min-w-0 lg:w-96">
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, student ID, or email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            />
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm">
                                <div className="mb-4 h-12 w-12 animate-pulse rounded-2xl bg-sky-100" />
                                <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                                <div className="mb-5 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                                <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ) : parents.length === 0 ? (
                    <section className="rounded-3xl border border-sky-100 bg-white/90 px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                            <PiUserCircle className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">No parents found matching your search</p>
                    </section>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {parents.map((parent) => (
                                <div key={parent.id} className="rounded-3xl border border-sky-100 bg-white/92 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg">
                                    <div className="mb-4 flex items-center gap-3 border-b border-sky-100 pb-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                                            <PiStudent className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-950">{parent.studentName}</p>
                                            <p className="mt-0.5 text-xs font-medium text-slate-500">{parent.studentId}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                            <span className="text-sm font-bold">
                                                {(parent.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{parent.name || 'Unknown'}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">Parent/Guardian</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 rounded-2xl border border-sky-100 bg-sky-50/45 p-3">
                                        <a href={`mailto:${parent.email || ''}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-sky-700">
                                            <PiEnvelopeSimple className="h-4 w-4 flex-shrink-0 text-sky-700" />
                                            <span className="truncate">{parent.email || 'No email provided'}</span>
                                        </a>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <PiPhone className="h-4 w-4 flex-shrink-0 text-sky-700" />
                                            <span>{parent.phone || 'No phone provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 shadow-sm hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                                    <PiCaretLeft className="h-5 w-5" />
                                </button>
                                <span className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 shadow-sm hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                                    <PiCaretRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {showAddModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/70 p-5">
                                <h3 className="text-lg font-bold text-slate-950">Add New Parent</h3>
                                <button onClick={() => setShowAddModal(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 hover:bg-sky-50 hover:text-sky-700">
                                    <PiX className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddParent} className="space-y-4 p-5">
                                {[
                                    ['Student Name', 'studentName', 'Enter student name', 'text', true],
                                    ['Student ID', 'studentId', 'U2024XXX', 'text', true],
                                    ['Parent Name', 'parentName', 'Enter parent name', 'text', true],
                                    ['Email', 'email', 'parent@email.com', 'email', true],
                                    ['Phone', 'phone', '+1 XXX-XXX-XXXX', 'tel', false],
                                ].map(([label, key, placeholder, type, required]) => (
                                    <div key={key}>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
                                        <input
                                            type={type}
                                            required={required}
                                            value={newParent[key]}
                                            onChange={(e) => setNewParent({ ...newParent, [key]: e.target.value })}
                                            className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                            placeholder={placeholder}
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-3 border-t border-sky-100 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
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
