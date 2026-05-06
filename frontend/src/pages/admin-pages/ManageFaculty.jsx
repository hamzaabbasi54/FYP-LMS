import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdEmail, MdMoreHoriz } from 'react-icons/md';

const ManageFaculty = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const facultyMembers = [
        { id: 1, name: "Dr. Evelyn Reed", designation: "Professor", email: "evelyn.reed@university.edu", avatar: "ER" },
        { id: 2, name: "Prof. Samuel Grant", designation: "Associate Professor", email: "samuel.grant@university.edu", avatar: "SG" },
        { id: 3, name: "Dr. Alisha Chen", designation: "Assistant Professor", email: "alisha.chen@university.edu", avatar: "AC" },
        { id: 4, name: "Mr. David Lee", designation: "Lecturer", email: "david.lee@university.edu", avatar: "DL" },
        { id: 5, name: "Ms. Olivia Martinez", designation: "Lecturer", email: "olivia.m@university.edu", avatar: "OM" },
        { id: 6, name: "Dr. Benjamin Carter", designation: "Professor", email: "ben.carter@university.edu", avatar: "BC" },
        { id: 7, name: "Dr. Sophia Rodriguez", designation: "Visiting Faculty", email: "sophia.r@university.edu", avatar: "SR" },
        { id: 8, name: "Mr. Liam Wilson", designation: "Assistant Professor", email: "liam.wilson@university.edu", avatar: "LW" },
    ];

    const filteredFaculty = facultyMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDesignationColor = (designation) => {
        switch (designation) {
            case 'Professor': return 'from-violet-500 to-purple-600';
            case 'Associate Professor': return 'from-blue-500 to-indigo-600';
            case 'Assistant Professor': return 'from-emerald-500 to-teal-600';
            case 'Lecturer': return 'from-amber-500 to-orange-600';
            case 'Visiting Faculty': return 'from-pink-500 to-rose-600';
            default: return 'from-slate-400 to-slate-500';
        }
    };

    const getDesignationBadge = (designation) => {
        switch (designation) {
            case 'Professor': return 'bg-violet-100 text-violet-700';
            case 'Associate Professor': return 'bg-blue-100 text-blue-700';
            case 'Assistant Professor': return 'bg-emerald-100 text-emerald-700';
            case 'Lecturer': return 'bg-amber-100 text-amber-700';
            case 'Visiting Faculty': return 'bg-pink-100 text-pink-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Faculty Members
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5 mt-1">Manage instructor profiles and assignments</p>
                    </div>

                    <Link
                        to="/admin-managefaculty/addfaculty"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
                    >
                        <MdAdd className="w-5 h-5" />
                        Add Faculty
                    </Link>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or designation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Faculty List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Faculty Member</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Designation</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Email</th>
                                    <th className="text-right py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredFaculty.map((member) => (
                                    <tr key={member.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getDesignationColor(member.designation)} flex items-center justify-center shadow-lg`}>
                                                    <span className="text-white font-bold text-sm">{member.avatar}</span>
                                                </div>
                                                <span className="font-semibold text-slate-800">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDesignationBadge(member.designation)}`}>
                                                {member.designation}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 transition-colors"
                                            >
                                                <MdEmail className="w-4 h-4" />
                                                <span>{member.email}</span>
                                            </a>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                <MdMoreHoriz className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{filteredFaculty.length}</span> of {facultyMembers.length} faculty members
                        </p>
                    </div>
                </div>

                {filteredFaculty.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-400">No faculty members found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageFaculty;