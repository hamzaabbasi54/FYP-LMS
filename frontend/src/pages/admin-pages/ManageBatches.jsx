import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdSearch, MdAdd, MdPeople, MdBook } from 'react-icons/md';

const ManageBatches = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const batches = [
        {
            id: 1,
            name: "Batch 2022-26",
            students: 115,
            courses: 8,
            year: "Year 2",
            color: "from-emerald-500 to-teal-600"
        },
        {
            id: 2,
            name: "Batch 2024-28",
            students: 125,
            courses: 8,
            year: "Year 1",
            color: "from-blue-500 to-indigo-600"
        },
        {
            id: 3,
            name: "Batch 2025-29",
            students: 130,
            courses: 2,
            year: "Upcoming",
            color: "from-amber-500 to-orange-600"
        }
    ];

    const filteredBatches = batches.filter(batch =>
        batch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                        <Link to="/admin-dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
                        <span>/</span>
                        <span className="text-slate-600">Manage Batches</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Student Batches
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5 mt-1">Manage and organize student cohorts</p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search batches..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Batches Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                    {filteredBatches.map((batch) => (
                        <Link
                            to={`/admin-managebatches/${batch.id}`}
                            key={batch.id}
                            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                        >
                            {/* Gradient Header */}
                            <div className={`h-28 bg-gradient-to-br ${batch.color} relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                <div className="absolute bottom-3 left-4">
                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                                        {batch.year}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-slate-900">
                                    {batch.name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <MdPeople className="w-4 h-4 text-slate-400" />
                                        <span>{batch.students}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MdBook className="w-4 h-4 text-slate-400" />
                                        <span>{batch.courses} Courses</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Add New Batch Card */}
                    <Link
                        to="/admin-managebatches/addbatch"
                        className="group rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 min-h-[220px] hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
                            <MdAdd className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 group-hover:text-slate-800">Add New Batch</h3>
                        <p className="text-sm text-slate-400 mt-1">Create a new cohort</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ManageBatches;