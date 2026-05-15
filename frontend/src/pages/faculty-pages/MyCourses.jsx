import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdEdit, MdPeople, MdCheckCircle, MdAssignment, MdArrowForward, MdArrowBack } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';

// Component for Course Management Cards
const ManagementCard = ({ icon: Icon, title, description, buttonText, iconColor, buttonColor, iconBgColor, to = "#" }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor} mb-4 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
            <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed">
                {description}
            </p>
            <Link
                to={to}
                className={`inline-flex items-center ${buttonColor} font-semibold text-sm hover:underline group mt-auto`}
            >
                {buttonText}
                <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};

const MyCourses = () => {
    const { selectedCourse } = useCourse();
    const navigate = useNavigate();

    // If no course is selected, redirect back to dashboard
    if (!selectedCourse) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Course Selected</h3>
                    <p className="text-gray-400 mb-4">Please select a course from the dashboard first.</p>
                    <button
                        onClick={() => navigate('/faculty-dashboard')}
                        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                        <MdArrowBack className="w-4 h-4 mr-2" />
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const course = selectedCourse;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/faculty-dashboard')}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
                <MdArrowBack className="w-4 h-4 mr-1" />
                Back to Dashboard
            </button>

            {/* Course Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Course Title and Badge */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        {course.title}
                    </h1>
                    <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                        {course.code}
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Left Side - Course Info */}
                    <div className="flex-1">
                        {/* Course Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                            <span>{course.batch_name}</span>
                            <span className="text-gray-300">•</span>
                            <span>{course.semester_name}</span>
                            <span className="text-gray-300">•</span>
                            <span>{course.credit_hours} Credits</span>
                        </div>

                        {/* Course Description */}
                        {course.description && (
                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                                {course.description}
                            </p>
                        )}
                    </div>

                    {/* Right Side - Action Buttons and Student Count */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to={`/faculty-mycourses/${course.assignment_id}/register-student`}
                                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                <MdPeople className="w-4 h-4 mr-2" />
                                Add Student
                            </Link>
                            <Link
                                to={`/faculty-mycourses/${course.assignment_id}/edit-syllabus`}
                                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                <MdEdit className="w-4 h-4 mr-2" />
                                Edit Syllabus
                            </Link>
                        </div>

                        {/* Student Count */}
                        <div className="flex items-center text-gray-600 text-sm">
                            <MdPeople className="w-5 h-5 mr-2 text-gray-400" />
                            <span className="font-semibold">{course.student_count} Total Students</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Management Section */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Course Management</h2>

                {/* Management Cards Grid - Equal height cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <ManagementCard
                        icon={MdPeople}
                        title="Manage Students"
                        description="View the full student directory, enroll new students, and manage course access."
                        buttonText="View Student Details"
                        iconColor="text-blue-600"
                        buttonColor="text-blue-600"
                        iconBgColor="bg-blue-50"
                        to={`/faculty-mycourses/${course.assignment_id}/students`}
                    />
                    <ManagementCard
                        icon={MdCheckCircle}
                        title="Manage Attendance"
                        description="Mark daily attendance, edit past records, and export attendance sheets."
                        buttonText="Go to Attendance"
                        iconColor="text-green-600"
                        buttonColor="text-green-600"
                        iconBgColor="bg-green-50"
                        to={`/faculty-mycourses/${course.assignment_id}/attendance`}
                    />
                    <ManagementCard
                        icon={MdAssignment}
                        title="Manage Grades"
                        description="Create and edit assignments, quizzes, and manage the full gradebook."
                        buttonText="Open Gradebook"
                        iconColor="text-purple-600"
                        buttonColor="text-purple-600"
                        iconBgColor="bg-purple-50"
                        to={`/faculty-mycourses/${course.assignment_id}/grading`}
                    />
                </div>
            </div>
        </div>
    );
};

export default MyCourses;


