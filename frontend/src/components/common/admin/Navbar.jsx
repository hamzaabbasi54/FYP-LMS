import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { PiList } from 'react-icons/pi';

const Navbar = ({ onMenuClick }) => {
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
        <div className="flex justify-between items-center h-full px-4 sm:px-6 lg:px-8 bg-white/82 backdrop-blur-xl border-b border-sky-100 gap-3">
            {/* Title */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    className="mobile-menu-button"
                    aria-label="Open navigation"
                    onClick={onMenuClick}
                >
                    <PiList className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-950 truncate">
                    {getPageTitle(location.pathname)}
                </h1>
                {user.department && (
                    <p className="text-xs sm:text-sm text-slate-500 truncate">Department: {user.department}</p>
                )}
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* User */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-100 flex items-center justify-center shadow-sm">
                        <span className="text-sky-700 font-bold text-sm">
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
