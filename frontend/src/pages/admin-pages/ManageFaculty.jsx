import React from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdMoreHoriz } from 'react-icons/md';

const ManageFaculty = () => {
    // Mock Data based on your screenshot
    const facultyMembers = [
        { id: 1, name: "Dr. Evelyn Reed", designation: "Professor" },
        { id: 2, name: "Prof. Samuel Grant", designation: "Associate Professor" },
        { id: 3, name: "Dr. Alisha Chen", designation: "Assistant Professor" },
        { id: 4, name: "Mr. David Lee", designation: "Lecturer" },
        { id: 5, name: "Ms. Olivia Martinez", designation: "Lecturer" },
        { id: 6, name: "Dr. Benjamin Carter", designation: "Professor" },
        { id: 7, name: "Dr. Sophia Rodriguez", designation: "Visiting Faculty" },
        { id: 8, name: "Mr. Liam Wilson", designation: "Assistant Professor" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">

            {/* --- Header Section --- */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Faculty Members</h2>

                <Link
                    to="/admin-managefaculty/addfaculty"
                    className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-colors font-medium text-sm"
                >
                    <MdAdd className="w-5 h-5 mr-2" />
                    Add New Faculty Member
                </Link>
            </div>

            {/* --- Faculty List Table --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <th className="px-8 py-4 w-1/2">Name</th>
                        <th className="px-8 py-4 w-1/3">Designation</th>
                        <th className="px-8 py-4 text-right"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {facultyMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors group">

                            {/* Name Column */}
                            <td className="px-8 py-5">
                  <span className="font-semibold text-gray-800 text-sm">
                    {member.name}
                  </span>
                            </td>

                            {/* Designation Column */}
                            <td className="px-8 py-5">
                  <span className="text-gray-500 text-sm font-medium">
                    {member.designation}
                  </span>
                            </td>

                            {/* Actions Column */}
                            <td className="px-8 py-5 text-right">
                                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <MdMoreHoriz className="w-6 h-6" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Optional: Empty State if no data */}
                {facultyMembers.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No faculty members found.
                    </div>
                )}
            </div>

        </div>
    );
};

export default ManageFaculty;