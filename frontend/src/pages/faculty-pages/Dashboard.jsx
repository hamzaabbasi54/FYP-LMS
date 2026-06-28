import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PiArrowRight,
    PiBookOpen,
    PiBooks,
    PiCalendarCheck,
    PiChartLineUp,
    PiCpu,
    PiFlask,
    PiGear,
    PiGraduationCap,
    PiUsersThree
} from 'react-icons/pi';
import { useCourse } from '../../context/CourseContext';
import { courseApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

// Icons to cycle through
const ICONS = [PiGraduationCap, PiFlask, PiGear, PiBooks, PiCpu, PiBookOpen];

const CourseCard = ({ course, icon }) => {
    const { setCourse } = useCourse();
    const navigate = useNavigate();

    const handleClick = () => {
        setCourse(course);
        navigate(`/faculty-mycourses/${course.assignment_id}`);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="group w-full rounded-2xl border border-sky-100 bg-white/92 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                    {React.createElement(icon, { className: 'w-6 h-6' })}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-950 transition-colors group-hover:text-sky-700">{course.title}</h3>
                        <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                            {course.code}
                        </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{course.batch_name}</span>
                        <span className="hidden text-slate-300 sm:inline">•</span>
                        <span>{course.semester_name}</span>
                        <span className="hidden text-slate-300 sm:inline">•</span>
                        <span>{course.credit_hours} Credits</span>
                    </div>
                </div>

                <div className="hidden items-center gap-5 sm:flex">
                    <div className="text-right">
                        <p className="text-xl font-bold leading-none text-slate-950">{course.student_count}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Students</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                        Manage
                        <PiArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </button>
    );
};

const Dashboard = () => {
    const { setCourse } = useCourse();
    const { user } = useAuth();

    useEffect(() => {
        setCourse(null);
    }, [setCourse]);

    const { data: courses = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ['facultyDashboardCourses'],
        queryFn: async () => {
            const response = await courseApi.getAssigned();
            if (response.success) return response.data || [];
            throw new Error('Failed to load assigned courses. Please try again.');
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000,    // 1 hour
        refetchOnWindowFocus: true,
        retry: 2
    });

    const error = queryError?.message || null;

    // Derived stats
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.student_count || 0), 0);

    const stats = [
        {
            label: 'Assigned Courses',
            value: loading ? '...' : totalCourses,
            icon: PiBooks,
            trend: 'Current semester',
            tone: 'bg-sky-50 text-sky-700'
        },
        {
            label: 'Total Students',
            value: loading ? '...' : totalStudents,
            icon: PiUsersThree,
            trend: 'Across all courses',
            tone: 'bg-cyan-50 text-cyan-700'
        },
        {
            label: 'Today',
            value: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
            icon: PiCalendarCheck,
            trend: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            tone: 'bg-indigo-50 text-indigo-700'
        }
    ];

    return (
        <div className="min-h-[calc(100dvh-128px)] lg:h-[calc(100vh-154px)] lg:overflow-hidden">
            <div className="mx-auto flex min-h-0 max-w-7xl flex-col gap-3 lg:h-full">
                {/* Hero Section */}
                <section className="relative min-h-[126px] overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-4 shadow-[0_24px_80px_rgba(14,116,144,0.14)] backdrop-blur-2xl lg:p-5">
                    <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-sky-200/35 blur-3xl" />
                    <div className="absolute bottom-0 right-10 hidden h-24 w-64 rounded-full bg-cyan-100/60 blur-2xl md:block" />
                    <div className="relative grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                            <h1 className="mt-1.5 text-3xl font-bold text-slate-950">
                                Faculty Dashboard
                            </h1>
                            <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600">
                                Welcome back, {user?.full_name || user?.name || 'Faculty'}. Manage your active courses, attendance, grading, and syllabus from one clean workspace.
                            </p>
                        </div>
                        <div className="w-full rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-600 shadow-sm sm:w-auto sm:min-w-[238px] lg:justify-self-end">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Department</p>
                            <p className="mt-1 font-semibold text-slate-900">{user?.department || 'Department'}</p>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white/90 p-3.5 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className={`${stat.tone} rounded-xl p-2.5 shadow-sm`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <PiChartLineUp className="h-5 w-5 text-sky-200 transition-colors group-hover:text-sky-400" />
                            </div>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                            <h3 className="mt-1 text-3xl font-bold leading-none text-slate-950">{stat.value}</h3>
                            <p className="mt-1 text-xs font-medium text-slate-500">{stat.trend}</p>
                        </div>
                    ))}
                </div>

                {/* --- Assigned Courses Section --- */}
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white/90 shadow-sm backdrop-blur">
                    <div className="border-b border-sky-100 bg-sky-50/70 px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-700 shadow-sm">
                                    <PiGraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Assigned Courses</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Select a course to manage attendance, grades, and syllabus.</p>
                                </div>
                            </div>
                            <div className="hidden rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm sm:block">
                                {loading ? 'Loading' : `${totalCourses} active`}
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 bg-sky-50/30 p-4 lg:overflow-y-auto">
                        {/* Loading State */}
                        {loading && (
                            <div className="flex justify-center items-center py-16">
                                <div className="animate-spin rounded-xl h-10 w-10 border-b-2 border-sky-600"></div>
                                <span className="ml-3 text-slate-500 font-medium">Loading courses...</span>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <p className="text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && courses.length === 0 && (
                            <div className="bg-white border border-sky-100 rounded-2xl p-8 text-center shadow-sm">
                                <PiBooks className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">No Courses Assigned</h3>
                                <p className="text-slate-500">You don't have any courses assigned yet. Please contact your department admin.</p>
                            </div>
                        )}

                        {/* Course Cards Grid */}
                        {!loading && !error && courses.length > 0 && (
                                    <div className="space-y-3">
                                        {courses.map((course, index) => (
                                            <CourseCard
                                                key={course.assignment_id}
                                                course={course}
                                                icon={ICONS[index % ICONS.length]}
                                            />
                                        ))}
                                    </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
