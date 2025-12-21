import React from 'react';
import { Link } from 'react-router-dom';
import { MdEdit, MdPeople, MdCheckCircle, MdAssignment, MdArrowForward } from 'react-icons/md';

// Component for Course Management Cards
const ManagementCard = ({ icon: Icon, title, description, buttonText, iconColor, buttonColor, iconBgColor }) => {
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
                to="#"
                className={`inline-flex items-center ${buttonColor} font-semibold text-sm hover:underline group mt-auto`}
            >
                {buttonText}
                <MdArrowForward className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};

const MyCourses = () => {
    // Course data
    const course = {
        title: "Introduction to Programming",
        code: "CS-101",
        schedule: "Mon, Wed 10:00 AM",
        room: "Room 304",
        credits: "4 Credits",
        description: "Fundamental concepts of programming using Python. Control structures, data types, and basic algorithms.",
        totalStudents: 118,
        batch: "Batch 2023-2027"
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                            <span>{course.schedule}</span>
                            <span className="text-gray-300">•</span>
                            <span>{course.room}</span>
                            <span className="text-gray-300">•</span>
                            <span>{course.credits}</span>
                        </div>

                        {/* Course Description */}
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                            {course.description}
                        </p>
                    </div>

                    {/* Right Side - Action Buttons and Student Count */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                        {/* Action Buttons */}
                        <Link
                            to="/faculty-mycourses/edit-syllabus"
                            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
                        >
                            <MdEdit className="w-4 h-4 mr-2" />
                            Edit Syllabus
                        </Link>

                        {/* Student Count */}
                        <div className="flex items-center text-gray-600 text-sm">
                            <MdPeople className="w-5 h-5 mr-2 text-gray-400" />
                            <span className="font-semibold">{course.totalStudents} Total Students</span>
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
                    />
                    <ManagementCard
                        icon={MdCheckCircle}
                        title="Manage Attendance"
                        description="Mark daily attendance, edit past records, and export attendance sheets."
                        buttonText="Go to Attendance"
                        iconColor="text-green-600"
                        buttonColor="text-green-600"
                        iconBgColor="bg-green-50"
                    />
                    <ManagementCard
                        icon={MdAssignment}
                        title="Manage Grades"
                        description="Create and edit assignments, quizzes, and manage the full gradebook."
                        buttonText="Open Gradebook"
                        iconColor="text-purple-600"
                        buttonColor="text-purple-600"
                        iconBgColor="bg-purple-50"
                    />
                </div>
            </div>
        </div>
    );
};

export default MyCourses;

