import React from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdMoreVert, MdChevronLeft, MdChevronRight, MdArrowDropDown } from 'react-icons/md';

const ManageCourses = () => {
    // Mock Data to replicate the screenshot
    const courses = [
        {
            id: 1,
            title: "Introduction to Quantum Physics",
            code: "PHY-301",
            credits: "4.0",
            instructor: "Dr. Emily Carter",
            status: "Active",
            color: "bg-indigo-100 text-indigo-600", // Color for the icon box
            initials: "CS"
        },
        {
            id: 2,
            title: "Advanced English Literature",
            code: "ENG-202",
            credits: "3.0",
            instructor: "Prof. David Lee",
            status: "Active",
            color: "bg-pink-100 text-pink-600",
            initials: "EN"
        },
        {
            id: 3,
            title: "Intro to Computer Science",
            code: "CS-101",
            credits: "4.0",
            instructor: "Dr. Sarah Connor",
            status: "Draft",
            color: "bg-blue-100 text-blue-600",
            initials: "CS"
        },
        {
            id: 4,
            title: "Calculus II",
            code: "MAT-201",
            credits: "3.0",
            instructor: "Prof. Alan Turing",
            status: "Active",
            color: "bg-orange-100 text-orange-600",
            initials: "MA"
        },
        {
            id: 5,
            title: "Business Ethics",
            code: "BUS-305",
            credits: "2.0",
            instructor: "Unassigned",
            status: "Inactive",
            color: "bg-teal-100 text-teal-600",
            initials: "BA"
        },
        {
            id: 6,
            title: "Art History 101",
            code: "ART-101",
            credits: "3.0",
            instructor: "Ms. Frida K.",
            status: "Active",
            color: "bg-purple-100 text-purple-600",
            initials: "AR"
        },
    ];

    // Helper to get status badge styles
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Draft': return 'bg-yellow-100 text-yellow-700';
            case 'Inactive': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* --- Top Actions Bar --- */}
            <div className="flex justify-between items-center">
                {/* Filter Dropdown */}
                <div className="relative">
                    <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                        <span>Status: Active</span>
                        <MdArrowDropDown className="text-gray-500 w-5 h-5" />
                    </button>
                </div>

                {/* Add Button */}
                <Link
                    to="/admin-managecourses/admin-addcourses" // Pointing to the page we made earlier
                    className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <MdAdd className="w-5 h-5" />
                    <span>Add New Course</span>
                </Link>
            </div>

            {/* --- Stats Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Total Courses</h3>
                    <p className="text-3xl font-bold text-gray-800">86</p>
                    <p className="text-green-600 text-xs font-semibold mt-2 flex items-center">
                        ↗ +4 this semester
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Draft Courses</h3>
                    <p className="text-3xl font-bold text-gray-800">12</p>
                    <p className="text-gray-400 text-xs mt-2">Pending approval</p>
                </div>
            </div>

            {/* --- Course List Table --- */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-white border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                        <th className="p-6">Course Info</th>
                        <th className="p-6">Credits</th>
                        <th className="p-6">Instructor</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50 transition-colors group">

                            {/* Course Name & Code */}
                            <td className="p-6">
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm mr-4 ${course.color}`}>
                                        {course.initials}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{course.title}</h4>
                                        <span className="text-gray-400 text-xs">{course.code}</span>
                                    </div>
                                </div>
                            </td>

                            {/* Credits */}
                            <td className="p-6">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                    {course.credits}
                  </span>
                            </td>

                            {/* Instructor */}
                            <td className="p-6">
                                <div className="flex items-center">
                                    {/* Placeholder Avatar - using Dicebear for consistent look */}
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructor}`}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full bg-gray-200 mr-3 border border-white shadow-sm"
                                    />
                                    <span className={`text-sm font-medium ${course.instructor === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                      {course.instructor}
                    </span>
                                </div>
                            </td>

                            {/* Status */}
                            <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(course.status)}`}>
                    {course.status}
                  </span>
                            </td>

                            {/* Action Menu */}
                            <td className="p-6 text-right">
                                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                                    <MdMoreVert className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* --- Pagination Footer --- */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-800">1 to 6</span> of <span className="font-bold text-gray-800">86</span> results
                    </p>

                    <div className="flex items-center space-x-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                            <MdChevronLeft />
                        </button>

                        <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-600 bg-blue-50 text-blue-600 font-bold text-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">3</button>
                        <span className="px-2 text-gray-400 text-sm">...</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">10</button>

                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
                            <MdChevronRight />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ManageCourses;