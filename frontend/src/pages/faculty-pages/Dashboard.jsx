import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSchool, MdScience, MdSettings, MdArrowForward, MdViewList, MdViewModule, MdBook, MdComputer, MdBiotech } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';
import { courseApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

// Gradient color palette for course cards
const GRADIENT_COLORS = [
    "bg-gradient-to-br from-purple-600 to-purple-400",
    "bg-gradient-to-br from-green-600 to-green-400",
    "bg-gradient-to-br from-blue-600 to-blue-400",
    "bg-gradient-to-br from-orange-500 to-orange-400",
    "bg-gradient-to-br from-pink-600 to-pink-400",
    "bg-gradient-to-br from-teal-600 to-teal-400",
    "bg-gradient-to-br from-indigo-600 to-indigo-400",
    "bg-gradient-to-br from-red-500 to-red-400",
];

// Icons to cycle through
const ICONS = [MdSchool, MdScience, MdSettings, MdBook, MdComputer, MdBiotech];

// Component for Course Cards
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
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >
            {/* Top Colored Section */}
            <div className={`h-24 ${gradientColor} relative`}>
                <div className="absolute top-4 left-4">
                    <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="absolute top-4 right-4 text-right">
                    <p className="text-sm font-bold text-white">{course.code}</p>
                    <p className="text-xs text-white text-opacity-90">{course.credit_hours} Credits</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{course.batch_name}</p>
                <p className="text-xs text-gray-400 mb-4">{course.semester_name}</p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">{course.student_count} Students</p>
                    <span className="inline-flex items-center text-blue-600 font-semibold text-sm group">
                        Manage Course
                        <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { setCourse } = useCourse();

    useEffect(() => {
        setCourse(null);
    }, [setCourse]);

    const { data: courses = [], isLoading: loading, error: queryError } = useQuery({
        queryKey: ['facultyDashboardCourses'],
        queryFn: async () => {
            const response = await courseApi.getAssigned();
            if (response.success) return response.data || [];
            throw new Error('Failed to load assigned courses. Please try again.');
        }
    });

    const error = queryError?.message || null;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* --- Assigned Courses Section --- */}
            <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Assigned Courses</h2>
                        <p className="text-gray-500 text-sm sm:text-base">
                            Select a course to manage attendance, grades, and syllabus for the current semester.
                        </p>
                    </div>
                    {/* View Toggle Icons */}
                    <div className="flex items-center space-x-2">
                        <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors">
                            <MdViewList className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors">
                            <MdViewModule className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-500">Loading courses...</span>
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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                        <MdBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Courses Assigned</h3>
                        <p className="text-gray-400">You don't have any courses assigned yet. Please contact your department admin.</p>
                    </div>
                )}

                {/* Course Cards Grid - Responsive */}
                {!loading && !error && courses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
    );
};

export default Dashboard;