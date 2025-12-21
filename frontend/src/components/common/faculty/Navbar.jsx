import React from 'react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();

    const getPageTitle = (pathname) => {
        // We use 'startsWith' or 'includes' so sub-pages still show the correct Parent Title.
        if (pathname === '/faculty-dashboard' || pathname === '/faculty') return 'Overview';

        if (pathname.includes('/faculty-mycourses')) return 'My Courses';
        if (pathname.includes('/faculty-schedule')) return 'Schedule';
        if (pathname.includes('/faculty-attendance')) return 'Attendance';
        if (pathname.includes('/faculty-grades')) return 'Grades';
        if (pathname.includes('/faculty-messages')) return 'Messages';
        if (pathname.includes('/faculty-announcements')) return 'Announcements';

        return 'Overview'; // Default
    };

    const currentTitle = getPageTitle(location.pathname);

    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center h-full px-4 sm:px-6 lg:px-8 bg-white border-b py-3 sm:py-0">
            {/* Dynamic Title */}
            <div className="mb-3 sm:mb-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                    {currentTitle}
                </h1>
                {currentTitle === 'Overview' && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Welcome back, Professor Doe. Manage your active batches.
                    </p>
                )}
            </div>

            {/* Search and Profile Section */}
            <div className="flex items-center space-x-3 sm:space-x-6">
                <div className="relative flex-1 sm:flex-initial">
                    <input
                        type="text"
                        placeholder="Search courses or students..."
                        className="bg-gray-100 text-sm rounded-full px-4 py-2 w-full sm:w-64 lg:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button className="relative text-gray-500 hover:text-blue-600 flex-shrink-0">
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2 ring-2 ring-white"></span>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>
            </div>
        </div>
    );
};

export default Navbar;

