import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSchool, MdScience, MdSettings, MdArrowForward, MdBook, MdComputer, MdBiotech, MdPeople, MdTrendingUp } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { courseApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

// Icons to cycle through
const ICONS = [MdSchool, MdScience, MdSettings, MdBook, MdComputer, MdBiotech];

// Gradient color palette for course cards
const GRADIENT_COLORS = [
    "from-purple-500 to-purple-600",
    "from-green-500 to-green-600",
    "from-blue-500 to-blue-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-teal-500 to-teal-600",
    "from-indigo-500 to-indigo-600",
    "from-red-500 to-red-600",
];

const CourseCard = ({ course, icon: Icon, gradientColor }) => {
    const { setCourse } = useCourse();
    const navigate = useNavigate();

    const handleClick = () => {
        setCourse(course);
        navigate(`/faculty-mycourses/${course.assignment_id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="group relative bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200 hover:shadow-xl hover:shadow-slate-300/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
        >
            {/* Gradient accent in top right */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientColor} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-15 transition-opacity`}></div>

            <div className="relative flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{course.code}</p>
                        <p className="text-xs text-slate-500">{course.credit_hours} Credits</p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-1">{course.batch_name}</p>
                <p className="text-xs text-slate-400 mb-4">{course.semester_name}</p>

                <div className="mt-auto pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MdPeople className="w-4 h-4 text-slate-400" />
                        <p className="text-sm font-bold text-slate-700">{course.student_count} Students</p>
                    </div>
                    <span className="inline-flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                        Manage
                        <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </div>
        </div>
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
            icon: MdBook,
            trend: 'Current semester',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            label: 'Total Students',
            value: loading ? '...' : totalStudents,
            icon: MdPeople,
            trend: 'Across all courses',
            color: 'from-emerald-500 to-teal-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            Faculty Dashboard
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {user?.department || 'Department'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="group relative bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200 hover:shadow-xl hover:shadow-slate-300/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default"
                        >
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

                {/* --- Assigned Courses Section --- */}
                <div className="mb-10 bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b-2 border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                                <MdSchool className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">My Assigned Courses</h2>
                                <p className="text-sm text-slate-500">Select a course to manage attendance, grades, and syllabus.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50">
                        {/* Loading State */}
                        {loading && (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-slate-500 font-medium">Loading courses...</span>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                                <p className="text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && courses.length === 0 && (
                            <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                                <MdBook className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700 mb-2">No Courses Assigned</h3>
                                <p className="text-slate-500">You don't have any courses assigned yet. Please contact your department admin.</p>
                            </div>
                        )}

                        {/* Course Cards Grid */}
                        {!loading && !error && courses.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {courses.map((course, index) => (
                                    <CourseCard
                                        key={course.assignment_id}
                                        course={course}
                                        icon={ICONS[index % ICONS.length]}
                                        gradientColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;