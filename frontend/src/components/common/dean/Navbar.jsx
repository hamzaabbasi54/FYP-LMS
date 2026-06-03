import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLogout, MdNotifications, MdPerson } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
const DeanNavbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
            <div>
                <h1 className="text-xl font-semibold text-gray-800">Dean Panel</h1>
                {user.faculty && (
                    <p className="text-sm text-gray-500">Faculty of {user.faculty}</p>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <MdNotifications className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <MdPerson className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-800">{user.fullName || 'Dean'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
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

export default DeanNavbar;
