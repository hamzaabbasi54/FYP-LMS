import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdFilterList, MdChevronLeft, MdChevronRight, MdDelete, MdInfoOutline } from 'react-icons/md';
import { courseApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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

    const deleteMutation = useMutation({
        mutationFn: (id) => courseApi.delete(id),
        onMutate: async (deletedId) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['courses'] });
            // Snapshot the previous value for rollback
            const previousData = queryClient.getQueryData(['courses', page, searchQuery]);
            // Optimistically remove the course from the cache
            queryClient.setQueryData(['courses', page, searchQuery], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.filter(course => course.id !== deletedId),
                    pagination: { ...old.pagination, total: (old.pagination?.total || 1) - 1 }
                };
            });
            return { previousData };
        },
        onSuccess: () => {
            toast.success('Course deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
        onError: (error, _deletedId, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(['courses', page, searchQuery], context.previousData);
            }
            console.error('Error deleting course:', error);
            toast.error(error.response?.data?.message || 'Failed to delete course');
        }
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            deleteMutation.mutate(id);
        }
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Course Catalog
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${total} courses found`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/admin-managecourses/clos"
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-200"
                        >
                            CLOs
                        </Link>
                        <Link
                            to="/admin-managecourses/admin-addcourses"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                        >
                            <MdAdd className="w-5 h-5" />
                            Add Course
                        </Link>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by course name or code..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="relative">
                            <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-slate-50 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none min-w-[160px]"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {filteredCourses.map((course, index) => (
                                <div
                                    key={course.id}
                                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className={`bg-gradient-to-r ${colorPalette[index % colorPalette.length]} p-5`}>
                                        <div className="flex items-center justify-between">
                                            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-lg">
                                                {course.code}
                                            </span>
                                            <span className="text-white/80 text-sm font-medium">
                                                {course.credit_hours} Credits
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <Link to={`/admin-managecourses/${course.id}`}>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
                                                {course.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-slate-500 mb-3">
                                            {course.department_name || 'No Department'}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${getStatusStyle(course.status || 'Active')}`}>
                                                {course.status || 'Active'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    to={`/admin-managecourses/${course.id}`}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="View Details"
                                                >
                                                    <MdInfoOutline className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(course.id)}
                                                    disabled={deleteMutation.isPending && deleteMutation.variables === course.id}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
                                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <MdChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-slate-600 px-4">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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