import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdPerson, MdEdit, MdDelete, MdAdd, MdSearch, MdFilterList, MdCheckCircle, MdCancel } from 'react-icons/md';
import { authApi } from '../../services/api';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, [filterRole, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filterRole && filterRole !== 'all') filters.role = filterRole;
            if (searchTerm) filters.search = searchTerm;

            const response = await authApi.getAllUsers(filters);

            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const roleLabels = {
        course_coordinator: 'Course Coordinator',
        ta: 'Teaching Assistant',
        deptadmin: 'Director',
        dean: 'Dean',
        faculty: 'Faculty'
    };

    const roleColors = {
        course_coordinator: 'from-teal-500 to-cyan-600',
        ta: 'from-green-500 to-emerald-600',
        deptadmin: 'from-purple-500 to-violet-600',
        dean: 'from-orange-500 to-amber-600',
        faculty: 'from-pink-500 to-rose-600'
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await authApi.deleteUser(userId);

                if (response.success) {
                    fetchUsers();
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user');
            }
        }
    };

    const handleToggleActive = async (userId) => {
        try {
            const response = await authApi.toggleUserStatus(userId);

            if (response.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Failed to update user status');
        }
    };

    const stats = [
        {
            label: 'Total Users',
            value: users.length,
            color: 'from-blue-500 to-indigo-600'
        },
        {
            label: 'Course Coordinators',
            value: users.filter(u => u.role === 'course_coordinator').length,
            color: 'from-teal-500 to-cyan-600'
        },
        {
            label: 'Faculty',
            value: users.filter(u => u.role === 'faculty').length,
            color: 'from-pink-500 to-rose-600'
        },
        {
            label: 'Teaching Assistants',
            value: users.filter(u => u.role === 'ta').length,
            color: 'from-green-500 to-emerald-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    User Management
                                </h1>
                            </div>
                            <p className="text-slate-500 ml-5">
                                Manage all system users and their roles
                            </p>
                        </div>
                        <Link
                            to="/admin-createaccount"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                        >
                            <MdAdd className="w-5 h-5" />
                            Create Account
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300"
                        >
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-3 shadow-lg`}>
                                <MdPerson className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="relative">
                            <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
                            >
                                <option value="all">All Roles</option>
                                <option value="course_coordinator">Course Coordinator</option>
                                <option value="faculty">Faculty</option>
                                <option value="ta">Teaching Assistant</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Department</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Contact</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Permissions</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColors[user.role] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                                                        <span className="text-white font-bold text-sm">
                                                            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{user.fullName}</p>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r ${roleColors[user.role] || 'from-gray-500 to-gray-600'}`}>
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-800">{user.department || 'N/A'}</p>
                                                <p className="text-xs text-slate-500">{user.faculty || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600">{user.phoneNumber || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">
                                                    {user.permissions?.length || 0} modules
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(user._id)}
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${user.isActive
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {user.isActive ? (
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <MdEdit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <MdDelete className="w-5 h-5" />
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
