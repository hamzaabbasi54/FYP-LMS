import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdLogout, MdAccountBalance } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
const DeanSidebar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const NavItem = ({ icon: Icon, label, to }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
                    flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 mb-1
                    ${isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
            >
                {({ isActive }) => (
                    <>
                        <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-indigo-700' : 'text-gray-500'}`} />
                        <span className="font-medium">{label}</span>
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col w-full h-full px-4 py-8 bg-white border-r">
            {/* Header */}
            <div className="flex items-center mb-8 px-2">
                <div className="bg-indigo-800 p-2 rounded-lg text-white mr-3">
                    <MdAccountBalance className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">University LMS</h2>
                    <p className="text-xs text-indigo-600 font-semibold">Dean Panel</p>
                </div>
            </div>

            {/* Faculty Info */}
            {user.faculty && (
                <div className="mb-6 px-2 py-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-indigo-600 font-medium">Faculty</p>
                    <p className="text-sm font-semibold text-indigo-800">{user.faculty}</p>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex flex-col flex-grow">
                <NavItem to="/dean-dashboard" icon={MdDashboard} label="Dashboard" />
            </nav>

            {/* User Profile and Logout */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex items-center px-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <span className="text-indigo-700 font-bold text-sm">
                            {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'D'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-semibold text-sm truncate">{user.fullName || 'Dean'}</p>
                        <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                        title="Logout"
                    >
                        <MdLogout className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeanSidebar;
