import React from 'react';
import { MdGrade, MdScience, MdPeople, MdAssignment, MdAccessTime } from 'react-icons/md';

const TADashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const stats = [
        { label: 'Pending Grades', value: '12', icon: MdGrade, color: 'bg-yellow-500' },
        { label: 'Upcoming Labs', value: '3', icon: MdScience, color: 'bg-blue-500' },
        { label: 'Attendance Sheets', value: '5', icon: MdPeople, color: 'bg-green-500' },
        { label: 'Active Assignments', value: '8', icon: MdAssignment, color: 'bg-purple-500' },
    ];

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.fullName || 'TA'}!</h1>
                <p className="text-gray-600">Here's an overview of your assistance duties.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center">
                        <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white mr-4 shadow-md`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <MdAccessTime className="mr-2 text-sky-600" /> Recent Activity
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-start pb-4 border-b border-gray-50">
                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Graded Quiz 1 for CS-101</p>
                                <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-start pb-4 border-b border-gray-50">
                            <div className="w-2 h-2 mt-2 rounded-full bg-green-500 mr-3"></div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Marked Attendance for Lab 3</p>
                                <p className="text-xs text-gray-500">Yesterday at 2:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-sky-50 rounded-lg text-sky-700 font-medium hover:bg-sky-100 transition-colors text-center">
                            Marks Entry
                        </button>
                        <button className="p-4 bg-sky-50 rounded-lg text-sky-700 font-medium hover:bg-sky-100 transition-colors text-center">
                            Start Lab
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TADashboard;
