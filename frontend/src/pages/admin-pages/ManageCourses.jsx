import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdFilterList, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const ManageCourses = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const courses = [
        { id: 1, title: "Introduction to Quantum Physics", code: "PHY-301", credits: "4.0", instructor: "Dr. Emily Carter", status: "Active", color: "from-indigo-500 to-violet-600" },
        { id: 2, title: "Advanced English Literature", code: "ENG-202", credits: "3.0", instructor: "Prof. David Lee", status: "Active", color: "from-pink-500 to-rose-600" },
        { id: 3, title: "Intro to Computer Science", code: "CS-101", credits: "4.0", instructor: "Dr. Sarah Connor", status: "Draft", color: "from-blue-500 to-cyan-600" },
        { id: 4, title: "Calculus II", code: "MAT-201", credits: "3.0", instructor: "Prof. Alan Turing", status: "Active", color: "from-amber-500 to-orange-600" },
        { id: 5, title: "Business Ethics", code: "BUS-305", credits: "2.0", instructor: "Unassigned", status: "Inactive", color: "from-teal-500 to-emerald-600" },
        { id: 6, title: "Art History 101", code: "ART-101", credits: "3.0", instructor: "Ms. Frida K.", status: "Active", color: "from-purple-500 to-fuchsia-600" },
    ];

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || course.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700';
            case 'Draft': return 'bg-amber-100 text-amber-700';
            case 'Inactive': return 'bg-slate-100 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const stats = [
        { label: 'Total Courses', value: '86', trend: '+4 this semester', color: 'from-blue-500 to-indigo-600' },
        { label: 'Active Courses', value: '68', trend: '79% of total', color: 'from-emerald-500 to-teal-600' },
        { label: 'Draft Courses', value: '12', trend: 'Pending review', color: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Manage Courses
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5 mt-1">Create, edit, and organize course catalog</p>
                    </div>

                    <Link
                        to="/admin-managecourses/admin-addcourses"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Course
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="group bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-300/50 hover:scale-[1.02] hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 cursor-pointer">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-white text-lg">📚</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                            <p className="text-xs text-slate-400">{stat.trend}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <MdFilterList className="w-5 h-5 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Course List */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Course</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Credits</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Instructor</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center shadow-lg shadow-slate-200/50`}>
                                                    <span className="text-white font-bold text-sm">{course.code.slice(0, 2)}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">{course.title}</h4>
                                                    <p className="text-xs text-slate-400">{course.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg">
                                                {course.credits}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                                    <span className="text-slate-600 text-xs font-bold">
                                                        {course.instructor.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                                <span className={`text-sm ${course.instructor === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                                                    {course.instructor}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(course.status)}`}>
                                                {course.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{filteredCourses.length}</span> of {courses.length} courses
                        </p>
                        <div className="flex items-center gap-1">
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                                <MdChevronLeft className="w-5 h-5" />
                            </button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm">1</button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm">2</button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                                <MdChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCourses;