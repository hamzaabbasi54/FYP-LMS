import React from 'react';
import { Link } from 'react-router-dom';
import {
    PiArrowRight,
    PiBooks,
    PiCalendarCheck,
    PiChalkboardTeacher,
    PiChartLineUp,
    PiStudent,
    PiUserPlus,
    PiUsersThree
} from 'react-icons/pi';
import { dashboardApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const { data: dashStats = {} } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await dashboardApi.getStats();
            if (response.success) return response.data || {};
            throw new Error('Failed to load stats');
        },
        staleTime: Infinity,
    });

    const stats = [
        {
            label: 'Published Courses',
            value: dashStats.total_courses ?? '...',
            icon: PiBooks,
            description: 'Total course catalog',
            tone: 'bg-sky-50 text-sky-700'
        },
        {
            label: 'Active Faculty',
            value: dashStats.total_users ?? '...',
            icon: PiChalkboardTeacher,
            description: 'Approved department users',
            tone: 'bg-indigo-50 text-indigo-700'
        },
        {
            label: 'Active Students',
            value: dashStats.total_students ?? '...',
            icon: PiStudent,
            description: 'Current student records',
            tone: 'bg-cyan-50 text-cyan-700'
        },
        {
            label: 'Active Batches',
            value: dashStats.active_batches ?? '...',
            icon: PiCalendarCheck,
            description: 'Running academic cohorts',
            tone: 'bg-blue-50 text-blue-700'
        },
    ];

    const quickActions = [
        {
            title: 'Create Account',
            description: 'Add new users with role assignments',
            to: '/admin-createaccount',
            icon: PiUserPlus,
        },
        {
            title: 'Manage Users',
            description: 'View and manage all system users',
            to: '/admin-manageusers',
            icon: PiUsersThree,
        },
        {
            title: 'Manage Batches',
            description: 'Organize student cohorts and academic years',
            to: '/admin-managebatches',
            icon: PiCalendarCheck,
        },
        {
            title: 'Manage Courses',
            description: 'Update syllabuses and materials',
            to: '/admin-managecourses',
            icon: PiBooks,
        },
        {
            title: 'Manage Faculty',
            description: 'Oversee instructor profiles',
            to: '/admin-managefaculty',
            icon: PiChalkboardTeacher,
        },
    ];

    return (
        <div className="min-h-[calc(100dvh-128px)] lg:h-[calc(100vh-128px)] lg:overflow-hidden">
            <div className="max-w-7xl w-full mx-auto flex min-h-0 flex-col gap-3 lg:h-full">
                <section className="relative min-h-[126px] overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-4 shadow-[0_24px_80px_rgba(14,116,144,0.14)] backdrop-blur-2xl lg:p-5">
                    <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-sky-200/35 blur-3xl" />
                    <div className="absolute bottom-0 right-10 hidden h-24 w-64 rounded-full bg-cyan-100/60 blur-2xl md:block" />
                    <div className="relative grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-1.5 text-3xl font-bold text-slate-950">
                                Department Dashboard
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600">
                                Manage academic operations for {user.department || 'your department'} with a clean view of courses, faculty, students, and batches.
                            </p>
                        </div>
                        <div className="w-full rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm sm:w-auto sm:min-w-[238px] lg:justify-self-end">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Today</p>
                            <p className="mt-1 font-semibold text-slate-900">{formattedDate}</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white/90 p-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-sky-100" />
                            <div className="flex items-start justify-between gap-4">
                                <div className={`${stat.tone} rounded-xl p-2.5 shadow-sm`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <PiChartLineUp className="h-5 w-5 text-sky-200 transition-colors group-hover:text-sky-400" />
                            </div>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                            <h3 className="mt-1 text-3xl font-bold text-slate-950">{stat.value}</h3>
                            <p className="mt-1 text-sm text-slate-500">{stat.description}</p>
                        </div>
                    ))}
                </div>

                <section className="rounded-3xl border border-sky-100 bg-white/90 p-3.5 shadow-sm backdrop-blur lg:p-4">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Workflows</p>
                            <h2 className="mt-1 text-xl font-bold text-slate-950">Quick Actions</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.to}
                                className="group flex min-h-[110px] flex-col rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-sky-100"
                            >
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-700 shadow-sm">
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mb-1 font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                                    {action.title}
                                </h3>
                                <p className="mb-3 flex-grow text-xs leading-5 text-slate-500">
                                    {action.description}
                                </p>
                                <div className="flex items-center text-xs font-semibold text-sky-700">
                                    Open <PiArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
