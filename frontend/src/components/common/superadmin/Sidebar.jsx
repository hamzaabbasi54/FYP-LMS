import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdLogout, MdSupervisedUserCircle } from 'react-icons/md';

const SuperAdminSidebar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const NavItem = ({ icon: Icon, label, to }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
                    flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 mb-1
                    ${isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
            >
                {({ isActive }) => (
                    <>
                        <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-purple-700' : 'text-gray-500'}`} />
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
                <div className="bg-purple-800 p-2 rounded-lg text-white mr-3">
                    <MdSupervisedUserCircle className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">University LMS</h2>
                    <p className="text-xs text-purple-600 font-semibold">Super Admin</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col flex-grow">
                <NavItem to="/superadmin-dashboard" icon={MdDashboard} label="Dashboard" />
            </nav>

            {/* User Profile and Logout */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex items-center px-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <span className="text-purple-700 font-bold text-sm">SA</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-semibold text-sm truncate">{user.fullName || 'Super Admin'}</p>
                        <p className="text-gray-500 text-xs truncate">{user.email || 'admin@gmail.com'}</p>
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

export default SuperAdminSidebar;
