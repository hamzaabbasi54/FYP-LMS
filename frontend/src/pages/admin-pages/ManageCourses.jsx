import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PiBookOpenText,
    PiBooks,
    PiCaretLeft,
    PiCaretRight,
    PiFunnelSimple,
    PiInfo,
    PiMagnifyingGlass,
    PiPlus,
    PiTarget,
    PiTrash
} from 'react-icons/pi';
import { courseApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';

const ManageCourses = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

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
            const guardRes = await courseApi.delete(course.id, { dryRun: true });
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
            case 'Active': return 'border-emerald-100 bg-emerald-50 text-emerald-700';
            case 'Draft': return 'border-amber-100 bg-amber-50 text-amber-700';
            case 'Inactive': return 'border-slate-200 bg-slate-50 text-slate-600';
            default: return 'border-sky-100 bg-sky-50 text-sky-700';
        }
    };

    const filteredCourses = statusFilter === 'all'
        ? courses
        : courses.filter(c => (c.status || '').toLowerCase() === statusFilter);

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:p-7">
                    <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-950">
                                Course Catalog
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Manage course records, credit hours, departments, CLOs, and catalog status.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/admin-managecourses/clos"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                            >
                                <PiTarget className="h-5 w-5" />
                                CLOs
                            </Link>
                            <Link
                                to="/admin-managecourses/admin-addcourses"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                            >
                                <PiPlus className="h-5 w-5" />
                                Add Course
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiBooks className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{loading ? 'Loading' : filteredCourses.length} courses shown</p>
                                <p className="text-xs text-slate-500">{loading ? 'Fetching course catalog' : `${total} total courses`}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative min-w-0 md:w-80">
                                <PiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by course name or code..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                            <div className="relative md:w-52">
                                <PiFunnelSimple className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-11 w-full appearance-none rounded-xl border border-sky-100 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="h-10 w-24 animate-pulse rounded-xl bg-sky-100" />
                                    <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
                                </div>
                                <div className="mb-3 h-5 w-4/5 animate-pulse rounded bg-slate-100" />
                                <div className="mb-6 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                                <div className="h-9 w-full animate-pulse rounded-2xl bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <section className="rounded-3xl border border-sky-100 bg-white/90 px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                            <PiBookOpenText className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No courses found</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            {searchQuery ? 'Try a different course title or code.' : 'Add your first course to start building the catalog.'}
                        </p>
                    </section>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="group relative flex min-h-[218px] flex-col rounded-3xl border border-sky-100 bg-white/92 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="inline-flex rounded-xl border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-sky-700">
                                            {course.code}
                                        </span>
                                        <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                            {course.credit_hours} Credits
                                        </span>
                                    </div>

                                    <Link to={`/admin-managecourses/${course.id}`} className="mt-5 block">
                                        <h3 className="line-clamp-2 text-lg font-bold text-slate-950 transition-colors group-hover:text-sky-700">
                                            {course.title}
                                        </h3>
                                    </Link>
                                    <p className="mt-2 text-sm text-slate-500">
                                        {course.department_name || 'No Department'}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(course.status || 'Active')}`}>
                                            {course.status || 'Active'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/admin-managecourses/${course.id}`}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                                title="View Details"
                                            >
                                                <PiInfo className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(course)}
                                                disabled={isPending(`course-${course.id}`)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <PiTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 shadow-sm transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <PiCaretLeft className="h-5 w-5" />
                                </button>
                                <span className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 shadow-sm transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
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

export default ManageCourses;
