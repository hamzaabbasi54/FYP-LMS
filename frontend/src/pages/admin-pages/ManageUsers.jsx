import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PiCheckCircle,
    PiFunnelSimple,
    PiMagnifyingGlass,
    PiPencilSimple,
    PiPlus,
    PiTrash,
    PiUserCircle,
    PiUsersThree,
    PiXCircle
} from 'react-icons/pi';
import { authApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ManageUsers = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    const { data: users = [], isLoading: loading } = useQuery({
        queryKey: ['users', filterRole, searchTerm],
        queryFn: async () => {
            const filters = {};
            if (filterRole && filterRole !== 'all') filters.role = filterRole;
            if (searchTerm) filters.search = searchTerm;

            const response = await authApi.getAllUsers(filters);
            if (response.success) return response.data || [];
            throw new Error('Failed to load users');
        }
    });

    const roleLabels = {
        deptadmin: 'Department Admin',
        faculty: 'Faculty'
    };

    const deleteMutation = useMutation({
        mutationFn: (userId) => authApi.deleteUser(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
        onError: () => toast.error('Failed to delete user')
    });

    const handleDelete = (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(userId);
        }
    };

    const toggleMutation = useMutation({
        mutationFn: (userId) => authApi.toggleUserStatus(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
        onError: () => toast.error('Failed to update user status')
    });

    const handleToggleActive = (userId) => {
        toggleMutation.mutate(userId);
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
                                User Management
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Manage department admins, faculty accounts, status, and contact details in one place.
                            </p>
                        </div>
                        <Link
                            to="/admin-createaccount"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                            <PiPlus className="h-5 w-5" />
                            Create Account
                        </Link>
                    </div>
                </section>


                <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                                <PiUsersThree className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{loading ? 'Loading' : users.length} users shown</p>
                                <p className="text-xs text-slate-500">Search and filter existing accounts</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative min-w-0 md:w-80">
                                <PiMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                />
                            </div>

                            <div className="relative md:w-56">
                                <PiFunnelSimple className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="h-11 w-full appearance-none rounded-xl border border-sky-100 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                >
                                    <option value="all">All roles</option>
                                    <option value="deptadmin">Department Admin</option>
                                    <option value="faculty">Faculty</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
                    <div className="overflow-auto">
                        <table className="w-full min-w-[920px]">
                            <thead className="sticky top-0 z-10 border-b border-sky-100 bg-sky-50/80 backdrop-blur">
                                <tr>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">User</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Role</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Department</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Contact</th>

                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Status</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="mx-auto flex max-w-sm flex-col items-center">
                                                <div className="mb-3 h-10 w-10 animate-pulse rounded-2xl bg-sky-100" />
                                                <p className="text-sm font-medium text-slate-700">Loading users...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="mx-auto flex max-w-sm flex-col items-center">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                                                    <PiUserCircle className="h-7 w-7" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">No users found</p>
                                                <p className="mt-1 text-sm text-slate-500">Try changing the search or role filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="border-t border-slate-100 transition-colors hover:bg-sky-50/45">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-sky-700">
                                                        <span className="text-xs font-bold">
                                                            {(user.full_name || user.fullName || '').split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900">{user.full_name || user.fullName}</p>
                                                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-slate-800">{user.department_name || 'N/A'}</p>
                                                <p className="text-xs text-slate-500">{user.faculty_name || 'N/A'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-600">{user.phone_number || 'N/A'}</p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(user.id)}
                                                    disabled={toggleMutation.isPending && toggleMutation.variables === user.id}
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${user.is_active
                                                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : 'border-red-100 bg-red-50 text-red-700 hover:bg-red-100'
                                                        }`}
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <PiCheckCircle className="h-4 w-4" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PiXCircle className="h-4 w-4" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                                        title="Edit user"
                                                    >
                                                        <PiPencilSimple className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                        title="Delete user"
                                                    >
                                                        <PiTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ManageUsers;
