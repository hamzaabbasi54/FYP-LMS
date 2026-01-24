import React from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd } from 'react-icons/md';

const ManageBatches = () => {
    // Mock Data matching your screenshot
    const batches = [
        {
            id: 1,
            name: "Batch 2022-26",
            students: "115 Students",
            courses: "8 Courses",
            year: "Year 2",
            gradient: "bg-gradient-to-br from-green-700 to-green-300"
        },
        {
            id: 2,
            name: "Batch 2024-28",
            students: "125 Students",
            courses: "8 Courses",
            year: "Year 1",
            gradient: "bg-gradient-to-br from-teal-700 to-yellow-200"
        },
        {
            id: 3,
            name: "Batch 2025-29",
            students: "130 Students",
            courses: "2 Courses",
            year: "Upcoming",
            gradient: "bg-gradient-to-br from-teal-600 to-orange-400"
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto h-full">

            {/* --- Breadcrumb & Header --- */}
            <div className="mb-2">
                <span className="text-gray-400 text-sm font-medium">Dashboard / Manage Batches</span>
            </div>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Student Batches</h2>
                    <p className="text-gray-500">View, search, and create new student batches.</p>
                </div>
            </div>

            {/* --- Search Bar --- */}
            <div className="relative mb-10 max-w-sm">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by batch year..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* --- Batches Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Render Existing Batches - UPDATED to use Link */}
                {batches.map((batch) => (
                    <Link
                        to={`/admin-managebatches/${batch.id}`}
                        key={batch.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                    >
                        <div className={`h-32 w-full ${batch.gradient}`}></div>
                        <div className="p-5 flex-grow">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{batch.name}</h3>
                            <p className="text-sm text-gray-500 font-medium mb-3">
                                {batch.students} • {batch.courses}
                            </p>
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-semibold">
                                {batch.year}
                            </span>
                        </div>
                    </Link>
                ))}

                {/* "Add New Batch" Dashed Card */}
                <Link
                    to="/admin-managebatches/addbatch"
                    className="rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 h-full min-h-[250px] hover:bg-gray-50 hover:border-blue-400 transition-all group"
                >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <MdAdd className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Add New Batch</h3>
                    <p className="text-sm text-gray-400 text-center mt-1">Create a new student cohort</p>
                </Link>

            </div>
        </div>
    );
};

export default ManageBatches;