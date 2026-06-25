import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PiBooks,
    PiCalendarCheck,
    PiCaretLeft,
    PiCaretRight,
    PiFolderOpen,
    PiMagnifyingGlass,
    PiPlus,
    PiStudent,
    PiTrash
} from 'react-icons/pi';
import { batchApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';
import { useDebounce } from '../../hooks/useDebounce';

const ManageBatches = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const limit = 12;
    const debouncedSearch = useDebounce(searchQuery, 350);
    const queryClient = useQueryClient();

    const { data: batchResponse, isLoading: loading, isFetching } = useQuery({
        queryKey: ['batches', page, debouncedSearch, limit],
        queryFn: async () => {
            const params = { page, limit };
            if (debouncedSearch) params.search = debouncedSearch;
            const response = await batchApi.getAll(params);
            if (response.success) {
                return {
                    batches: response.data || [],
                    pagination: response.pagination || null
                };
            }
            throw new Error('Failed to fetch batches');
        },
        placeholderData: keepPreviousData
    });

    const batches = batchResponse?.batches || [];
    const pagination = batchResponse?.pagination || null;

    React.useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPending = useUndoStore(s => s.isPending);

    const handleDelete = async (batch, e) => {
        e.preventDefault();
        e.stopPropagation();

        const undoId = `batch-${batch.id}`;
        if (isPending(undoId)) return;

        // Pre-flight: check for active data via deleteGuard
        try {
            const guardRes = await batchApi.delete(batch.id);
            if (guardRes.requiresConfirmation && guardRes.hasActiveData) {
                const confirmed = window.confirm(guardRes.message);
                if (!confirmed) return;
            }
        } catch {
            // Guard failed — proceed with undo queue anyway
        }

        // Optimistically remove from cache
        queryClient.setQueryData(['batches', page, debouncedSearch, limit], (old) => old ? ({
            ...old,
            batches: (old.batches || []).filter(b => b.id !== batch.id)
        }) : old);

        // Enqueue undo-able deletion
        enqueueUndo({
            id: undoId,
            type: 'Batch',
            label: batch.name,
            highRisk: true,
            apiCall: async () => {
                await batchApi.delete(batch.id, { confirm: true });
                queryClient.invalidateQueries({ queryKey: ['batches'] });
                toast.success(`Batch "${batch.name}" deleted`);
            },
            onUndo: () => {
                // Restore to cache
                queryClient.invalidateQueries({ queryKey: ['batches'] });
                toast.info(`Deletion of "${batch.name}" undone`);
            }
        });
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'completed': return 'Completed';
            case 'upcoming': return 'Upcoming';
            default: return status || 'Active';
        }
    };

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:p-7">
                    <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-950">
                                Manage Batches
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Organize academic cohorts, departments, semesters, and batch status from one clean workspace.
                            </p>
                        </div>
                        <Link
                            to="/admin-managebatches/addbatch"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                            <PiPlus className="h-5 w-5" />
                            Add Batch
                        </Link>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiFolderOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {loading ? 'Loading' : pagination ? `${batches.length} of ${pagination.total} batches shown` : `${batches.length} batches shown`}
                                </p>
                                <p className="text-xs text-slate-500">{isFetching && !loading ? 'Refreshing academic batches' : 'Search and browse academic batches'}</p>
                            </div>
                        </div>

                        <div className="relative min-w-0 lg:w-96">
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search batches by name or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            />
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-sky-100" />
                                    <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />
                                </div>
                                <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                                <div className="mb-6 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : batches.length === 0 ? (
                    <section className="rounded-3xl border border-sky-100 bg-white/90 px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                            <PiFolderOpen className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {debouncedSearch ? 'No batches match your search' : 'No batches yet'}
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            {debouncedSearch ? 'Try a different batch name or department.' : 'Create your first academic batch to start organizing students and semesters.'}
                        </p>
                        {!debouncedSearch && (
                            <Link
                                to="/admin-managebatches/addbatch"
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700"
                            >
                                <PiPlus className="h-5 w-5" />
                                Add Batch
                            </Link>
                        )}
                    </section>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {batches.map((batch) => (
                                <Link
                                    key={batch.id}
                                    to={`/admin-managebatches/${batch.id}`}
                                    className="group flex min-h-[230px] flex-col rounded-3xl border border-sky-100 bg-white/92 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-100"
                                >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                                        <PiFolderOpen className="h-6 w-6" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(batch, e)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                                        title="Delete batch"
                                    >
                                        <PiTrash className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-5">
                                    <h3 className="text-lg font-bold text-slate-950 transition-colors group-hover:text-sky-700">{batch.name}</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {batch.department_name || 'No Department'}
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/55 px-3 py-3">
                                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                            <PiStudent className="h-4 w-4 text-sky-700" />
                                            Students
                                        </div>
                                        <p className="text-lg font-bold text-slate-950">{batch.student_count || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/55 px-3 py-3">
                                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                            <PiBooks className="h-4 w-4 text-sky-700" />
                                            Semesters
                                        </div>
                                        <p className="text-lg font-bold text-slate-950">{batch.semester_count || 0}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-5">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]
                                        ${batch.status === 'active' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                                        batch.status === 'completed' ? 'border-sky-100 bg-sky-50 text-sky-700' :
                                        'border-amber-100 bg-amber-50 text-amber-700'}`}
                                    >
                                        {getStatusLabel(batch.status)}
                                    </span>
                                    {batch.start_date && (
                                        <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                                            <PiCalendarCheck className="h-4 w-4 text-slate-400" />
                                            {new Date(batch.start_date).getFullYear()}
                                        </div>
                                    )}
                                </div>
                                </Link>
                            ))}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 shadow-sm transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Previous page"
                                >
                                    <PiCaretLeft className="h-5 w-5" />
                                </button>
                                <span className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={!pagination.hasNext}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 shadow-sm transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Next page"
                                >
                                    <PiCaretRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ManageBatches;
