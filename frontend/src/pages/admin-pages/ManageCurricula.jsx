import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PiBookOpenText,
    PiBooks,
    PiFolders,
    PiGraduationCap,
    PiMagnifyingGlass,
    PiPlus,
    PiTrash,
    PiX
} from 'react-icons/pi';
import { curriculumApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';
import { useAuth } from '../../context/AuthContext';
import { createPortal } from 'react-dom';

const ManageCurricula = () => {
    const { user } = useAuth();

    const deptId = user?.department_id;
    const isDeptAdmin = user?.role === 'deptadmin';

    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newCurriculum, setNewCurriculum] = useState({ name: '', department_id: isDeptAdmin ? (deptId || '') : '', description: '' });

    const { data: curricula = [], isLoading: loading } = useQuery({
        queryKey: ['curricula'],
        queryFn: async () => {
            const response = await curriculumApi.getAll();
            if (response.success) return response.data || [];
            if (response.success) return response.data || [];
            throw new Error('Failed to fetch curricula');
        },
        staleTime: Infinity
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { departmentApi } = await import('../../services/api');
            const res = await departmentApi.getAll();
            if (res.success) return res.data || [];
            return [];
        }
    });

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPendingUndo = useUndoStore(s => s.isPending);

    const handleDelete = (curr, e) => {
        e.preventDefault();
        e.stopPropagation();
        const undoId = `curriculum-${curr.id}`;
        if (isPendingUndo(undoId)) return;

        // Optimistically remove from cache
        queryClient.setQueryData(['curricula'], (old) =>
            (old || []).filter(c => c.id !== curr.id)
        );

        enqueueUndo({
            id: undoId,
            type: 'Curriculum',
            label: curr.name,
            apiCall: async () => {
                await curriculumApi.delete(curr.id);
                queryClient.invalidateQueries({ queryKey: ['curricula'] });
                toast.success(`Curriculum "${curr.name}" deleted`);
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['curricula'] });
                toast.info(`Deletion of "${curr.name}" undone`);
            }
        });
    };

    const createMutation = useMutation({
        mutationFn: (data) => curriculumApi.create(data),
        onSuccess: () => {
            toast.success('Curriculum created with 8 semesters!');
            setShowCreateDialog(false);
            setNewCurriculum({ name: '', department_id: isDeptAdmin ? (deptId || '') : '', description: '' });
            queryClient.invalidateQueries({ queryKey: ['curricula'] });
        },
        onError: (error) => {
            console.error('Error creating curriculum:', error);
            toast.error(error.response?.data?.message || 'Failed to create curriculum');
        }
    });

    const handleCreate = () => {
        if (!newCurriculum.name || !newCurriculum.department_id) {
            toast.error('Name and department are required');
            return;
        }
        createMutation.mutate(newCurriculum);
    };

    const filteredCurricula = curricula.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:p-7">
                    <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-3 text-3xl font-bold text-slate-950">
                                Manage Curricula
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Build academic structures, organize semesters, and connect curricula with batches and courses.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateDialog(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                            <PiPlus className="h-5 w-5" />
                            Add Curriculum
                        </button>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiBookOpenText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{loading ? 'Loading' : filteredCurricula.length} curricula shown</p>
                                <p className="text-xs text-slate-500">{loading ? 'Fetching curricula' : `${curricula.length} total curricula`}</p>
                            </div>
                        </div>

                        <div className="relative min-w-0 lg:w-96">
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search curricula by name or department..."
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
                                    <div className="h-12 w-12 animate-pulse rounded-2xl bg-sky-100" />
                                    <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />
                                </div>
                                <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                                <div className="mb-6 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                                    <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCurricula.length === 0 ? (
                    <section className="rounded-3xl border border-sky-100 bg-white/90 px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                            <PiBookOpenText className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {searchQuery ? 'No curricula match your search' : 'No curricula yet'}
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            {searchQuery ? 'Try a different curriculum name or department.' : 'Create your first curriculum to define course structures.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700"
                            >
                                <PiPlus className="h-5 w-5" />
                                Add Curriculum
                            </button>
                        )}
                    </section>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredCurricula.map((curr) => (
                            <Link
                                key={curr.id}
                                to={`/admin-curricula/${curr.id}`}
                                className="group flex min-h-[240px] flex-col rounded-3xl border border-sky-100 bg-white/92 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-100"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                                        <PiBookOpenText className="h-6 w-6" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(curr, e)}
                                        disabled={isPendingUndo(`curriculum-${curr.id}`)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                        title="Delete curriculum"
                                    >
                                        <PiTrash className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-5">
                                    <h3 className="truncate text-lg font-bold text-slate-950 transition-colors group-hover:text-sky-700">{curr.name}</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {curr.department_name || 'No Department'}
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-3 gap-3">
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/55 px-3 py-3">
                                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                            <PiGraduationCap className="h-4 w-4 text-sky-700" />
                                            Sem
                                        </div>
                                        <p className="text-lg font-bold text-slate-950">{curr.total_semesters || 8}</p>
                                    </div>
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/55 px-3 py-3">
                                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                            <PiBooks className="h-4 w-4 text-sky-700" />
                                            Courses
                                        </div>
                                        <p className="text-lg font-bold text-slate-950">{curr.total_courses || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/55 px-3 py-3">
                                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                            <PiFolders className="h-4 w-4 text-sky-700" />
                                            Batches
                                        </div>
                                        <p className="text-lg font-bold text-slate-950">{curr.batch_count || 0}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-end pt-5">
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]
                                        ${curr.status === 'active' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                                    >
                                        {curr.status === 'active' ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {showCreateDialog && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/70 p-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Campus Flow</p>
                                <h2 className="mt-1 text-lg font-bold text-slate-950">Create New Curriculum</h2>
                            </div>
                            <button
                                onClick={() => setShowCreateDialog(false)}
                                disabled={createMutation.isPending}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
                            >
                                <PiX className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Curriculum Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newCurriculum.name}
                                    onChange={(e) => setNewCurriculum(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., BS Physics 2024"
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                            {!isDeptAdmin ? (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Department <span className="text-red-500">*</span></label>
                                    <select
                                        value={newCurriculum.department_id}
                                        onChange={(e) => setNewCurriculum(prev => ({ ...prev, department_id: e.target.value }))}
                                        className="h-11 w-full appearance-none rounded-xl border border-sky-100 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Department</label>
                                    <div className="flex h-11 w-full items-center rounded-xl border border-sky-100 bg-sky-50/70 px-3 text-sm text-slate-600">
                                        {user.department || 'Your Department'}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Description</label>
                                <textarea
                                    value={newCurriculum.description}
                                    onChange={(e) => setNewCurriculum(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this curriculum..."
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-xs leading-5 text-sky-800">
                                <strong>Note:</strong> 8 empty semesters will be automatically created. You can then add courses to each semester.
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-sky-100 bg-sky-50/50 p-5">
                            <button
                                onClick={() => setShowCreateDialog(false)}
                                disabled={createMutation.isPending}
                                className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-sky-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newCurriculum.name || !newCurriculum.department_id || createMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <PiPlus className="h-5 w-5" /> {createMutation.isPending ? 'Creating...' : 'Create Curriculum'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ManageCurricula;
