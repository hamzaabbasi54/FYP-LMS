import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdAdd, MdArrowForward, MdCode, MdLan, MdMemory, MdPsychology } from 'react-icons/md';

const SemesterCourses = () => {
    // We get both IDs so we know which Batch AND which Semester we are in
    const { id, semesterId } = useParams();

    // Mock Data
    const semesterInfo = {
        title: "Fall 2024 Courses",
        batchName: "Computer Science / Batch of 2025",
        semesterName: "Semester 5"
    };

    const courses = [
        {
            id: 301,
            code: "CS-301",
            title: "Data Structures and Algorithms",
            instructor: "Dr. Alan Turing",
            icon: MdCode
        },
        {
            id: 302,
            code: "CS-302",
            title: "Computer Networks",
            instructor: "Prof. Ada Lovelace",
            icon: MdLan
        },
        {
            id: 303,
            code: "CS-303",
            title: "Operating Systems",
            instructor: "Dr. Grace Hopper",
            icon: MdMemory
        },
        {
            id: 304,
            code: "CS-304",
            title: "Artificial Intelligence",
            instructor: "Prof. John McCarthy",
            icon: MdPsychology
        },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* --- Breadcrumb --- */}
            <div className="flex items-center text-sm text-gray-500 mb-2">
                <Link to={`/admin-managebatches/${id}`} className="hover:text-blue-600 flex items-center">
                    <MdArrowBack className="mr-1" /> Back
                </Link>
                <span className="mx-2">/</span>
                <span>{semesterInfo.batchName}</span>
                <span className="mx-2">/</span>
                <span className="font-semibold text-gray-800">{semesterInfo.semesterName}</span>
            </div>

            {/* --- Header & Add Button --- */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">{semesterInfo.title}</h2>

                <button className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-bold">
                    <MdAdd className="w-5 h-5 mr-2" /> Add Course
                </button>
            </div>

            {/* --- Search Bar --- */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by course title, code, or instructor..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:bg-gray-50 transition-colors"
                    />
                </div>
            </div>

            {/* --- Course List --- */}
            <div className="space-y-4">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow group">

                        {/* Left Side: Icon & Info */}
                        <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                            {/* Icon Box */}
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <course.icon className="w-6 h-6" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    <span className="text-gray-500 font-medium mr-2">{course.code}:</span>
                                    {course.title}
                                </h3>
                                <p className="text-sm text-blue-500 font-medium mt-0.5">{course.instructor}</p>
                            </div>
                        </div>

                        {/* Right Side: Button */}
                        <button className="w-full md:w-auto flex items-center justify-center bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            View Details <MdArrowForward className="ml-2 w-4 h-4" />
                        </button>

                    </div>
                ))}
            </div>

        </div>
    );
};

export default SemesterCourses;