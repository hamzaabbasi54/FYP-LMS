import React from 'react';
import { MdSearch, MdNotifications, MdSettings, MdArrowDropDown } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
const Navbar = () => {
    const { user } = useAuth();

    return (
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-800">Teaching Assistant Dashboard</h1>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search students or courses..."
                        className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <MdNotifications className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'T'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
