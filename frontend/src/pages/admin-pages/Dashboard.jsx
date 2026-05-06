import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdPeople, MdLibraryBooks, MdSchool, MdAssignmentLate, MdArrowForward, MdTrendingUp } from 'react-icons/md';
import { approvalApi, dashboardApi } from '../../services/api';

const Dashboard = () => {
    const [pendingFaculty, setPendingFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dashStats, setDashStats] = useState({});
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchPendingFaculty();
        fetchDashboardStats();
    }, []);

    const fetchPendingFaculty = async () => {
        try {
            const response = await approvalApi.getPendingUsers();
            if (response.success) {
                setPendingFaculty(response.data);
            }
        } catch (error) {
            console.error('Error fetching pending faculty:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await dashboardApi.getStats();
            if (response.success) {
                setDashStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await approvalApi.approveUser(userId);
            fetchPendingFaculty();
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    const handleReject = async (userId) => {
        try {
            await approvalApi.rejectUser(userId, 'Application rejected by Department Admin');
            fetchPendingFaculty();
        } catch (error) {
            console.error('Error rejecting user:', error);
        }
    };

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
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Director Dashboard
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {user.department || 'Department'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-300/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                        >
                            {/* Gradient accent */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-15 transition-opacity`}></div>

                            <div className="relative">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>

                                <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-slate-800 mb-2">{stat.value}</h3>

                                <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                    <MdTrendingUp className="w-3 h-3" />
                                    <span>{stat.trend}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pending Approvals */}
                {!loading && pendingFaculty.length > 0 && (
                    <div className="mb-10 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                                    <MdPeople className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800">Pending Faculty Approvals</h2>
                                    <p className="text-sm text-slate-500">{pendingFaculty.length} request{pendingFaculty.length > 1 ? 's' : ''} awaiting review</p>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
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
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(faculty.id)}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.to}
                                className={`group bg-white rounded-2xl p-6 border-2 border-slate-100 ${action.accent} hover:shadow-xl hover:shadow-slate-300/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300`}
                            >
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                    {action.icon}
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-slate-900">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                                    {action.description}
                                </p>
                                <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                                    Open <MdArrowForward className="ml-1 group-hover:translate-x-1 transition-transform" />
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