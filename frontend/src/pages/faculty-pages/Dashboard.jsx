import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSchool, MdScience, MdSettings, MdArrowForward, MdViewList, MdViewModule, MdBook } from 'react-icons/md';
import { useCourse } from '../../context/CourseContext';

// Component for Course Cards
const CourseCard = ({ course, icon: Icon, gradientColor }) => {
    const { setCourse } = useCourse();
    const navigate = useNavigate();

    const handleClick = () => {
        setCourse(course);
        navigate('/faculty-mycourses');
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
                    <p className="text-xs text-white text-opacity-90">{course.credits}</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course.batch}</p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">{course.totalStudents} Students</p>
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

    // Mock Data for Assigned Courses
    const courses = [
        {
            id: 1,
            title: "Introduction to Programming",
            code: "CS-101",
            batch: "Batch 2023-2027",
            schedule: "Mon, Wed 10:00 AM",
            room: "Room 304",
            credits: "4 Credits",
            description: "Fundamental concepts of programming using Python. Control structures, data types, and basic algorithms.",
            totalStudents: 118,
            icon: MdSchool,
            gradientColor: "bg-gradient-to-br from-purple-600 to-purple-400"
        },
        {
            id: 2,
            title: "Data Structures & Algorithms",
            code: "CS-201",
            batch: "Batch 2022-2026",
            schedule: "Tue, Thu 11:30 AM",
            room: "Lab 2",
            credits: "3 Credits",
            description: "Advanced data structures including trees, graphs, and hash tables.",
            totalStudents: 115,
            icon: MdScience,
            gradientColor: "bg-gradient-to-br from-green-600 to-green-400"
        },
        {
            id: 3,
            title: "Operating Systems",
            code: "CS-302",
            batch: "Batch 2021-2025",
            schedule: "Fri 09:00 AM",
            room: "Room 101",
            credits: "3 Credits",
            description: "Process management, memory management, file systems, and I/O systems.",
            totalStudents: 108,
            icon: MdSettings,
            gradientColor: "bg-gradient-to-br from-blue-600 to-blue-400"
        },
        {
            id: 4,
            title: "Advanced Machine Learning",
            code: "CS-501",
            batch: "Batch 2023-2025",
            schedule: "Mon 02:00 PM",
            room: "AI Lab",
            credits: "3 Credits",
            description: "Deep learning neural networks, CNNs, RNNs, and reinforcement learning.",
            totalStudents: 24,
            icon: MdBook,
            gradientColor: "bg-gradient-to-br from-orange-500 to-orange-400"
        },
        {
            id: 4,
            title: "Advanced Machine Learning",
            code: "CS-501",
            batch: "Batch 2023-2025",
            schedule: "Mon 02:00 PM",
            room: "AI Lab",
            credits: "3 Credits",
            description: "Deep learning neural networks, CNNs, RNNs, and reinforcement learning.",
            totalStudents: 24,
            icon: MdBook,
            gradientColor: "bg-gradient-to-br from-orange-500 to-orange-400"
        }
    ];

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

                {/* Course Cards Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            icon={course.icon}
                            gradientColor={course.gradientColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
