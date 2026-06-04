import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdPeople, MdBook, MdCalendarToday, MdDelete } from 'react-icons/md';
import { batchApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

    const deleteMutation = useMutation({
        mutationFn: (id) => batchApi.delete(id),
        onSuccess: () => {
            toast.success('Batch deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        },
        onError: (error) => {
            console.error('Error deleting batch:', error);
            toast.error('Failed to delete batch');
        }
    });

    const handleDelete = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this batch?')) {
            deleteMutation.mutate(id);
        }
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Manage Batches
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${batches.length} batches found`}
                        </p>
                    </div>
                    <Link
                        to="/admin-managebatches/addbatch"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Batch
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-4 mb-8">
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search batches by name or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
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
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl"
                            >
                                <MdAdd className="w-5 h-5" />
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
                                className="group bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Card Header */}
                                <div className={`bg-gradient-to-r ${colorPalette[index % colorPalette.length]} p-6`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">{batch.name}</h3>
                                        <button
                                            onClick={(e) => handleDelete(batch.id, e)}
                                            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                            title="Delete batch"
                                        >
                                            <MdDelete className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    <p className="text-white/80 text-sm mt-1">
                                        {batch.department_name || 'No Department'}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MdPeople className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium">{batch.student_count || 0} Students</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MdBook className="w-5 h-5 text-slate-400" />
                                            <span className="text-sm font-medium">{batch.semester_count || 0} Semesters</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold
                                            ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            batch.status === 'completed' ? 'bg-slate-100 text-slate-600' :
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