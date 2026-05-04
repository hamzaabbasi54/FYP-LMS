import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdFileDownload, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const StudentList = () => {
    const { id } = useParams(); // Use this ID to fetch data later

    // Mock Data
    const students = [
        { id: 'U2024001', name: 'Alice Johnson', email: 'alice.j@university.edu', contact: '+1 123-456-7890', cgpa: '3.85' },
        { id: 'U2024002', name: 'Bob Williams', email: 'bob.w@university.edu', contact: '+1 234-567-0981', cgpa: '3.50' },
        { id: 'U2024003', name: 'Charlie Brown', email: 'charlie.b@university.edu', contact: '+1 865-674-0012', cgpa: '3.02' },
        { id: 'U2024004', name: 'Diana Miller', email: 'diana.m@university.edu', contact: '+1 456-789-0123', cgpa: '3.71' },
        { id: 'U2024005', name: 'Ethan Davis', email: 'ethan.d@university.edu', contact: '+1 567-890-1234', cgpa: '2.64' },
        { id: 'U2024006', name: 'Fiona Garcia', email: 'fiona.g@university.edu', contact: '+1 678-901-2345', cgpa: '3.98' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">

            {/* Breadcrumb */}
            <div className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
                <Link to={`/admin-managebatches/${id}`} className="hover:text-blue-600 flex items-center">
                    <MdArrowBack className="mr-1" /> Back to Batch Details
                </Link>
                <span>/</span>
                <span className="text-gray-800 font-semibold">Students</span>
            </div>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Students in Computer Science 2024</h2>
                    <p className="text-sm text-gray-500 mt-1">A comprehensive list of all students enrolled in this batch.</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    {/* Search */}
                    <div className="relative w-full max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or student ID..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Student ID</th>
                            <th className="px-6 py-4">Contact Number</th>
                            <th className="px-6 py-4 text-right">CGPA</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{student.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{student.contact}</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{student.cgpa}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-800">1 to 6</span> of 6 results
                    </p>

                    <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Bottom Download Action */}
            <div className="mt-6 flex justify-end">
                <button className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium">
                    <MdFileDownload className="w-5 h-5 mr-2" /> Download List
                </button>
            </div>

        </div>
    );
};

export default StudentList;