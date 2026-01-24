import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdLogout, MdPerson } from 'react-icons/md';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'Admin Dashboard';

        if (pathname.includes('/admin-managebatches')) return 'Manage Batches';
        if (pathname.includes('/admin-courseassignment')) return 'Course Assignment';
        if (pathname.includes('/admin-managecourses')) return 'Manage Courses';
        if (pathname.includes('/admin-managefaculty')) return 'Manage Faculty';
        if (pathname.includes('/admin-reports')) return 'Reports';
        if (pathname.includes('/admin-settings')) return 'Settings';

        return 'Admin Dashboard';
    };

    const currentTitle = getPageTitle(location.pathname);

    return (
        <div className="flex justify-between items-center h-full px-8 bg-white border-b">
            {/* Dynamic Title */}
            <div>
                <h1 className="text-xl font-bold text-gray-800">{currentTitle}</h1>
                {user.department && (
                    <p className="text-sm text-gray-500">Department: {user.department}</p>
                )}
            </div>

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

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MdPerson className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-800">{user.fullName || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{user.email || ''}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-2 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Logout"
                    >
                        <MdLogout className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
