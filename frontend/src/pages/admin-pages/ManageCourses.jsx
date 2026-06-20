import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdFilterList, MdChevronLeft, MdChevronRight, MdDelete, MdInfoOutline } from 'react-icons/md';
import { courseApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';

const ManageCourses = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const colorPalette = [
        "from-indigo-500 to-violet-600",
        "from-pink-500 to-rose-600",
        "from-blue-500 to-cyan-600",
        "from-amber-500 to-orange-600",
        "from-teal-500 to-emerald-600",
        "from-purple-500 to-fuchsia-600"
    ];

    const { data, isLoading: loading } = useQuery({
        queryKey: ['courses', page, searchQuery],
        queryFn: async () => {
            const params = { page, limit: 12 };
            if (searchQuery) params.search = searchQuery;
            const response = await courseApi.getAll(params);
            if (response.success) return response;
            throw new Error('Failed to fetch courses');
        },
        placeholderData: keepPreviousData,
    });

    const courses = data?.data || [];
    const totalPages = data?.pagination?.totalPages || 1;
    const total = data?.pagination?.total || 0;

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPending = useUndoStore(s => s.isPending);

    const handleDelete = async (course) => {
        const undoId = `course-${course.id}`;
        if (isPending(undoId)) return;

        // Pre-flight: check for active data
        try {
            const guardRes = await courseApi.delete(course.id);
            if (guardRes.requiresConfirmation && guardRes.hasActiveData) {
                const confirmed = window.confirm(guardRes.message);
                if (!confirmed) return;
            }
        } catch { /* proceed */ }

        // Optimistically remove from cache
        queryClient.setQueryData(['courses', page, searchQuery], (old) => {
            if (!old) return old;
            return {
                ...old,
                data: old.data.filter(c => c.id !== course.id),
                pagination: { ...old.pagination, total: (old.pagination?.total || 1) - 1 }
            };
        });

        enqueueUndo({
            id: undoId,
            type: 'Course',
            label: `${course.code} - ${course.title}`,
            highRisk: true,
            apiCall: async () => {
                await courseApi.delete(course.id, { confirm: true });
                queryClient.invalidateQueries({ queryKey: ['courses'] });
                toast.success(`Course "${course.code}" deleted`);
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['courses'] });
                toast.info(`Deletion of "${course.code}" undone`);
            }
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700';
            case 'Draft': return 'bg-amber-100 text-amber-700';
            case 'Inactive': return 'bg-slate-100 text-slate-600';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    const filteredCourses = statusFilter === 'all'
        ? courses
        : courses.filter(c => (c.status || '').toLowerCase() === statusFilter);

    return (
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-200/80 to-slate-300/80 rounded-3xl p-6 shadow-md border border-slate-300/60 overflow-y-auto flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Course Catalog
                        </h1>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${total} courses found`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/admin-managecourses/clos"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
                        >
                            CLOs
                        </Link>
                        <Link
                            to="/admin-managecourses/admin-addcourses"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                        >
                            <MdAdd className="w-4 h-4" />
                            Add Course
                        </Link>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by course name or code..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                            />
                        </div>
                        <div className="relative">
                            <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full md:w-auto pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none appearance-none bg-white transition-all min-w-[160px]"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">No courses found</h3>
                        <p className="text-slate-400 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Add your first course to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Course Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                            {filteredCourses.map((course, index) => (
                                <div
                                    key={course.id}
                                    className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                                >
                                    <div className="bg-slate-50 border-b border-slate-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                                                {course.code}
                                            </span>
                                            <span className="text-slate-500 text-xs font-medium">
                                                {course.credit_hours} Credits
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <Link to={`/admin-managecourses/${course.id}`}>
                                            <h3 className="text-base font-semibold text-slate-800 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                                                {course.title}
                                            </h3>
                                        </Link>
                                        <p className="text-xs text-slate-500 mb-4">
                                            {course.department_name || 'No Department'}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(course.status || 'Active')}`}>
                                                {course.status || 'Active'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    to={`/admin-managecourses/${course.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="View Details"
                                                >
                                                    <MdInfoOutline className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(course)}
                                                    disabled={isPending(`course-${course.id}`)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <MdDelete className="w-4 h-4" />
                                                </button>
                                            </div>
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
            </div>
        </div>
    );
};

export default ManageCourses;