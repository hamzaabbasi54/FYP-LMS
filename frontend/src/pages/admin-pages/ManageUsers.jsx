import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdPerson, MdEdit, MdDelete, MdAdd, MdSearch, MdFilterList, MdCheckCircle, MdCancel } from 'react-icons/md';
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

    const roleColors = {
        deptadmin: 'from-purple-500 to-violet-600',
        faculty: 'from-pink-500 to-rose-600'
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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                User Management
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Manage all system users and their roles
                            </p>
                        </div>
                        <Link
                            to="/admin-createaccount"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium shadow-sm transition-colors"
                        >
                            <MdAdd className="w-5 h-5" />
                            Create Account
                        </Link>
                    </div>
                </div>


                {/* Filters */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Department</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Contact</th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors border-t border-slate-100">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                                                        <span className="font-bold text-xs">
                                                            {(user.full_name || user.fullName || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{user.full_name || user.fullName}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-800">{user.department_name || 'N/A'}</p>
                                                <p className="text-xs text-slate-500">{user.faculty_name || 'N/A'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-600">{user.phone_number || 'N/A'}</p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(user.id)}
                                                    disabled={toggleMutation.isPending && toggleMutation.variables === user.id}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${user.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <MdCheckCircle className="w-3 h-3" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MdCancel className="w-3 h-3" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <MdEdit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                        title="Delete user"
                                                    >
                                                        <MdDelete className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;
