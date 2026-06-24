import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PiChalkboardTeacher,
    PiEnvelopeSimple,
    PiGraduationCap,
    PiMagnifyingGlass,
    PiPlus,
    PiTrash,
    PiUserCircle
} from 'react-icons/pi';
import { approvalApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';

const ManageFaculty = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: facultyMembers = [], isLoading: loading } = useQuery({
        queryKey: ['faculty_approved'],
        queryFn: async () => {
            const res = await approvalApi.getUsersByRole('faculty');
            if (res.success) return res.data || [];
            throw new Error('Failed to load faculty');
        }
    });

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPendingUndo = useUndoStore(s => s.isPending);

    const handleDelete = (member) => {
        const undoId = `faculty-${member.id}`;
        if (isPendingUndo(undoId)) return;

        // Optimistically remove
        queryClient.setQueryData(['faculty_approved'], (old) =>
            (old || []).filter(m => m.id !== member.id)
        );

        enqueueUndo({
            id: undoId,
            type: 'Faculty',
            label: member.full_name || member.fullName || 'Faculty member',
            highRisk: true,
            apiCall: async () => {
                await approvalApi.deleteUser(member.id);
                queryClient.invalidateQueries({ queryKey: ['faculty_approved'] });
                toast.success('Faculty member removed');
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['faculty_approved'] });
                toast.info('Faculty removal undone');
            }
        });
    };

    const filteredFaculty = facultyMembers.filter(member =>
        (member.full_name || member.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
                                Faculty Management
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Manage approved faculty profiles, department visibility, and account access from one workspace.
                            </p>
                        </div>
                        <Link
                            to="/admin-managefaculty/addfaculty"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                            <PiPlus className="h-5 w-5" />
                            Add Faculty
                        </Link>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiChalkboardTeacher className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{loading ? 'Loading' : filteredFaculty.length} faculty shown</p>
                                <p className="text-xs text-slate-500">{loading ? 'Fetching faculty profiles' : `${facultyMembers.length} active faculty`}</p>
                            </div>
                        </div>

                        <div className="relative min-w-0 lg:w-96">
                            <PiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            />
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm">
                                <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-sky-100" />
                                <div className="mx-auto mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                                <div className="mx-auto mb-5 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                                <div className="h-9 animate-pulse rounded-2xl bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ) : filteredFaculty.length === 0 ? (
                    <section className="rounded-3xl border border-sky-100 bg-white/90 px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                            <PiUserCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            No faculty members found
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            {searchQuery ? 'Try a different name, email, or department.' : 'Add faculty members to begin managing academic staff.'}
                        </p>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {filteredFaculty.map((member) => {
                            const name = member.full_name || member.fullName || 'Unknown';
                            return (
                                <div
                                    key={member.id}
                                    className="group relative flex min-h-[246px] flex-col rounded-3xl border border-sky-100 bg-white/92 p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                                >
                                    <button
                                        onClick={() => handleDelete(member)}
                                        disabled={isPendingUndo(`faculty-${member.id}`)}
                                        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 opacity-0 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 group-hover:opacity-100"
                                        title="Remove faculty"
                                    >
                                        <PiTrash className="h-4 w-4" />
                                    </button>

                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                                        <span className="text-base font-bold">{getInitials(name)}</span>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-sm font-bold text-slate-950">{name}</h3>
                                        <p className="mt-1 text-xs font-medium text-slate-500">{member.designation || member.role || 'Faculty'}</p>
                                        {member.department && (
                                            <p className="mt-1 text-xs text-slate-400">{member.department}</p>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-5">
                                        <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-sky-100 bg-sky-50/55 px-3 py-2 text-xs text-slate-600">
                                            <PiEnvelopeSimple className="h-4 w-4 flex-shrink-0 text-sky-700" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700">
                                            <PiGraduationCap className="h-3.5 w-3.5" />
                                            Approved
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageFaculty;
