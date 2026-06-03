import React from 'react';
import { useLocation } from 'react-router-dom';
import { MdSearch, MdNotifications } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
const Navbar = () => {
    const location = useLocation();
    const { user } = useAuth();

    const getPageTitle = (pathname) => {
        if (pathname.includes('/admin-managebatches')) return 'Manage Batches';
        if (pathname.includes('/admin-courseassignment')) return 'Course Assignment';
        if (pathname.includes('/admin-managecourses')) return 'Manage Courses';
        if (pathname.includes('/admin-managefaculty')) return 'Manage Faculty';
        if (pathname.includes('/admin-parents')) return 'Parents Directory';
        if (pathname.includes('/admin-settings')) return 'Settings';
        if (pathname.includes('/admin-obe')) return 'OBE';
        return 'Dashboard';
    };

    return (
        <div className="flex justify-between items-center h-full px-8 bg-white/80 backdrop-blur-xl border-b border-slate-100">
            {/* Title */}
            <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {getPageTitle(location.pathname)}
                </h1>
                {user.department && (
                    <p className="text-sm text-slate-400">Department: {user.department}</p>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <MdNotifications className="w-6 h-6" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>

                {/* User */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-white font-bold text-sm">
                            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                        </span>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold text-slate-800">{user.fullName || 'Admin'}</p>
                        <p className="text-xs text-slate-400">{user.email || ''}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
