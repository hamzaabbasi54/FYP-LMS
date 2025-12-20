import React from 'react';
import { useLocation } from 'react-router-dom';
// import userImage from '../assets/user.png';

const Navbar = () => {
    const location = useLocation();

    const getPageTitle = (pathname) => {
        // We use 'startsWith' or 'includes' so sub-pages (like /add)
        // still show the correct Parent Title.
        if (pathname === '/') return 'Admin Dashboard';

        if (pathname.includes('/admin-managebatches')) return 'Manage Batches';
        if (pathname.includes('/admin-courseassignment')) return 'Course Assignment';
        if (pathname.includes('/admin-managecourses')) return 'Manage Courses';
        if (pathname.includes('/admin-managefaculty')) return 'Manage Faculty';
        if (pathname.includes('/admin-reports')) return 'Reports';
        if (pathname.includes('/admin-settings')) return 'Settings';

        return 'Admin Dashboard'; // Default
    };

    const currentTitle = getPageTitle(location.pathname);

    return (
        <div className="flex justify-between items-center h-full px-8 bg-white border-b">
            {/* Dynamic Title */}
            <h1 className="text-xl font-bold text-gray-800">
                {currentTitle}
            </h1>

            {/* Search and Profile Section */}
            <div className="flex items-center space-x-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-gray-100 text-sm rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button className="relative text-gray-500 hover:text-blue-600">
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2 ring-2 ring-white"></span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>

                <div className="h-8 w-8 rounded-full bg-orange-200 overflow-hidden border border-gray-200">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                </div>
            </div>
        </div>
    );
};

export default Navbar;