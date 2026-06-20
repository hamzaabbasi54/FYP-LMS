import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdPeople, MdBook, MdCalendarToday, MdDelete } from 'react-icons/md';
import { batchApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';

const ManageBatches = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const colorPalette = [
        "from-emerald-500 to-teal-600",
        "from-blue-500 to-indigo-600",
        "from-violet-500 to-purple-600",
        "from-amber-500 to-orange-600",
        "from-pink-500 to-rose-600",
        "from-cyan-500 to-sky-600"
    ];

    const { data: batches = [], isLoading: loading } = useQuery({
        queryKey: ['batches'],
        queryFn: async () => {
            const response = await batchApi.getAll();
            if (response.success) {
                return response.data || [];
            }
            throw new Error('Failed to fetch batches');
        }
    });

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
        queryClient.setQueryData(['batches'], (old) =>
            (old || []).filter(b => b.id !== batch.id)
        );

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

    const filteredBatches = batches.filter(batch =>
        batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'completed': return 'Completed';
            case 'upcoming': return 'Upcoming';
            default: return status || 'Active';
        }
    };

    return (
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-200/80 to-slate-300/80 rounded-3xl p-6 shadow-md border border-slate-300/60 overflow-y-auto flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Manage Batches
                        </h1>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${batches.length} batches found`}
                        </p>
                    </div>
                    <Link
                        to="/admin-managebatches/addbatch"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                    >
                        <MdAdd className="w-4 h-4" />
                        Add Batch
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search batches by name or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MdBook className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">
                            {searchQuery ? 'No batches match your search' : 'No batches yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first batch to get started'}
                        </p>
                        {!searchQuery && (
                            <Link
                                to="/admin-managebatches/addbatch"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                            >
                                <MdAdd className="w-4 h-4" />
                                Add Batch
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Batch Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBatches.map((batch, index) => (
                            <Link
                                key={batch.id}
                                to={`/admin-managebatches/${batch.id}`}
                                className="group bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500 flex flex-col gap-3"
                            >
                                {/* Card Header */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-slate-800">{batch.name}</h3>
                                        <button
                                            onClick={(e) => handleDelete(batch, e)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                            title="Delete batch"
                                        >
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {batch.department_name || 'No Department'}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="mt-auto pt-2">
                                    <div className="flex gap-4 text-sm text-slate-600 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <MdPeople className="w-4 h-4 text-slate-400" />
                                            <span>{batch.student_count || 0} Students</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MdBook className="w-4 h-4 text-slate-400" />
                                            <span>{batch.semester_count || 0} Semesters</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                                            ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            batch.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                                            'bg-amber-100 text-amber-700'}`}
                                        >
                                            {getStatusLabel(batch.status)}
                                        </span>
                                        {batch.start_date && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <MdCalendarToday className="w-3 h-3" />
                                                {new Date(batch.start_date).getFullYear()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageBatches;