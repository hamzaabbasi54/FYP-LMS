import React from 'react';
import { Link } from 'react-router-dom';
import { MdPeople, MdLibraryBooks, MdSchool, MdAssignmentLate, MdArrowForward, MdTrendingUp } from 'react-icons/md';
import { approvalApi, dashboardApi } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: pendingFaculty = [], isLoading: loading } = useQuery({
        queryKey: ['pendingFaculty'],
        queryFn: async () => {
            const response = await approvalApi.getPendingUsers();
            if (response.success) return response.data || [];
            throw new Error('Failed to load pending faculty');
        }
    });

    const { data: dashStats = {} } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await dashboardApi.getStats();
            if (response.success) return response.data || {};
            throw new Error('Failed to load stats');
        }
    });

    const approveMutation = useMutation({
        mutationFn: (userId) => approvalApi.approveUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingFaculty'] });
            queryClient.invalidateQueries({ queryKey: ['faculty_approved'] });
            queryClient.invalidateQueries({ queryKey: ['faculty_pending'] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (userId) => approvalApi.rejectUser(userId, 'Application rejected by Department Admin'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingFaculty'] });
            queryClient.invalidateQueries({ queryKey: ['faculty_pending'] });
        }
    });

    const handleApprove = (userId) => approveMutation.mutate(userId);
    const handleReject = (userId) => rejectMutation.mutate(userId);

    const stats = [
        {
            label: 'Pending Approvals',
            value: loading ? '...' : pendingFaculty.length,
            icon: MdPeople,
            trend: pendingFaculty.length > 0 ? 'Action Required' : 'All Clear',
            color: 'from-amber-500 to-orange-600'
        },
        {
            label: 'Published Courses',
            value: dashStats.total_courses ?? '...',
            icon: MdLibraryBooks,
            trend: 'Total catalog',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            label: 'Active Faculty',
            value: dashStats.total_users ?? '...',
            icon: MdSchool,
            trend: 'Approved users',
            color: 'from-violet-500 to-purple-600'
        },
        {
            label: 'Active Students',
            value: dashStats.total_students ?? '...',
            icon: MdAssignmentLate,
            trend: `${dashStats.active_batches ?? 0} active batches`,
            color: 'from-blue-500 to-indigo-600'
        },
    ];

    const quickActions = [
        {
            title: 'Create Account',
            description: 'Add new users with role assignments',
            to: '/admin-createaccount',
            icon: '👤',
            accent: 'hover:border-rose-400'
        },
        {
            title: 'Manage Users',
            description: 'View and manage all system users',
            to: '/admin-manageusers',
            icon: '👥',
            accent: 'hover:border-blue-400'
        },
        {
            title: 'Manage Batches',
            description: 'Organize student cohorts and academic years',
            to: '/admin-managebatches',
            icon: '📚',
            accent: 'hover:border-amber-400'
        },
        {
            title: 'Course Assignment',
            description: 'Assign instructors to courses',
            to: '/admin-courseassignment',
            icon: '📝',
            accent: 'hover:border-emerald-400'
        },
        {
            title: 'Manage Courses',
            description: 'Update syllabuses and materials',
            to: '/admin-managecourses',
            icon: '📖',
            accent: 'hover:border-violet-400'
        },
        {
            title: 'Manage Faculty',
            description: 'Oversee instructor profiles',
            to: '/admin-managefaculty',
            icon: '🎓',
            accent: 'hover:border-indigo-400'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">

                {/* Hero Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Director Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                        {user.department || 'Department'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2"
                        >
                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg w-fit">
                                <stat.icon className="w-5 h-5" />
                            </div>

                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>

                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <MdTrendingUp className="w-3 h-3" />
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending Approvals */}
                {!loading && pendingFaculty.length > 0 && (
                    <div className="mb-10 bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b-2 border-slate-200 bg-blue-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                                    <MdPeople className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">Pending Faculty Approvals</h2>
                                    <p className="text-sm text-slate-500">{pendingFaculty.length} request{pendingFaculty.length > 1 ? 's' : ''} awaiting review</p>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y-2 divide-slate-100">
                            {pendingFaculty.map((faculty) => (
                                <div key={faculty.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                            <span className="font-bold text-slate-600 text-sm">
                                                {(faculty.full_name || faculty.fullName || '')?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{faculty.full_name || faculty.fullName}</p>
                                            <p className="text-sm text-slate-500">{faculty.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 hidden sm:block">
                                            {new Date(faculty.created_at || faculty.createdAt).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => handleApprove(faculty.id)}
                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(faculty.id)}
                                            disabled={approveMutation.isPending || rejectMutation.isPending}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                        <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.to}
                                className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col"
                            >
                                <div className="text-3xl mb-3">
                                    {action.icon}
                                </div>
                                <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-slate-500 mb-3 flex-grow">
                                    {action.description}
                                </p>
                                <div className="flex items-center text-xs font-semibold text-blue-600">
                                    Open <MdArrowForward className="ml-1 w-3 h-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;