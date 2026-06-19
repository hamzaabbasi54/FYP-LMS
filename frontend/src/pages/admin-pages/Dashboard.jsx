import React from 'react';
import { Link } from 'react-router-dom';
import { MdPeople, MdLibraryBooks, MdSchool, MdAssignmentLate, MdArrowForward, MdTrendingUp } from 'react-icons/md';
import { dashboardApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();

    const { data: dashStats = {} } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await dashboardApi.getStats();
            if (response.success) return response.data || {};
            throw new Error('Failed to load stats');
        }
    });

    const stats = [
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
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex flex-col shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-6 lg:px-8 py-4 max-w-7xl w-full mx-auto flex-1 flex flex-col">

                {/* Hero Section */}
                <div className="mb-3 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Director Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                        {user.department || 'Department'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4 flex-shrink-0">
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


                {/* Quick Actions */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                        <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                        <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-2">
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