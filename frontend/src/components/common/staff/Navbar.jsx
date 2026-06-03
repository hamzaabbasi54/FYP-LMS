import React, { useState } from 'react';
import { MdSearch, MdNotifications, MdSettings, MdArrowDropDown } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
const Navbar = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const roleLabels = {
        course_coordinator: 'Course Coordinator',
        ta: 'Teaching Assistant'
    };

    return (
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm">
            {/* Left Section - Page Title */}
            <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Dashboard
                </h1>
                <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
                    {user.department || 'Department'}
                </span>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-48 lg:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <MdNotifications className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                            </span>
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                                {user.fullName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {roleLabels[user.role] || user.role}
                            </p>
                        </div>
                        <MdArrowDropDown className="w-5 h-5 text-gray-400 hidden sm:block" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    navigate('/staff-settings');
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <MdSettings className="w-4 h-4" />
                                Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
