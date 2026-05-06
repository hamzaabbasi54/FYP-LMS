import React from 'react';
import { MdDashboard, MdBook, MdAssignment, MdPeople, MdSchool } from 'react-icons/md';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const permissions = user.permissions || [];

    const roleLabels = {
        course_coordinator: 'Course Coordinator',
        ta: 'Teaching Assistant',
        faculty: 'Faculty'
    };

    // Count permissions by category
    const getPermissionCount = (prefix) => {
        return permissions.filter(p => p.startsWith(prefix)).length;
    };

    const stats = [
        {
            label: 'Course Permissions',
            value: getPermissionCount('courses'),
            icon: MdBook,
            color: 'from-blue-500 to-blue-600'
        },
        {
            label: 'Assignment Permissions',
            value: getPermissionCount('assignments') + getPermissionCount('grades'),
            icon: MdAssignment,
            color: 'from-emerald-500 to-emerald-600'
        },
        {
            label: 'Student Permissions',
            value: getPermissionCount('students') + getPermissionCount('attendance'),
            icon: MdPeople,
            color: 'from-purple-500 to-purple-600'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8 sm:mb-12">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                                    Welcome back, {user.fullName?.split(' ')[0] || 'User'}! 👋
                                </h1>
                                <p className="text-emerald-100 text-sm sm:text-base lg:text-lg">
                                    {roleLabels[user.role] || user.role} • {user.department || 'Department'} • {user.faculty || 'Faculty'}
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <MdSchool className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-medium">University LMS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs sm:text-sm font-medium">{stat.label}</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Permissions Overview */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-100">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <MdDashboard className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-emerald-600" />
                        Your Permissions
                    </h2>

                    {permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {permissions.map((permission, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs sm:text-sm font-medium border border-emerald-200"
                                >
                                    {permission}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No specific permissions assigned. Contact your administrator.</p>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">💡</span>
                        </div>
                        <div>
                            <h3 className="text-slate-800 font-semibold mb-1">Getting Started</h3>
                            <p className="text-slate-600 text-sm">
                                Use the sidebar menu to navigate to the modules you have access to.
                                Your menu items are personalized based on the permissions assigned to your account by the Director.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
