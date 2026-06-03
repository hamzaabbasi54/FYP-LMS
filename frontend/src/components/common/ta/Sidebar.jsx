import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdGrade, MdPeople, MdScience, MdSchool, MdLogout, MdAssignment } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
const Sidebar = () => {
    const location = useLocation();
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
                    ${isActive ? 'bg-sky-800 text-white' : 'text-sky-100 hover:bg-sky-800'}
                `}
            >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{label}</span>
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col w-full h-full px-4 py-8 bg-sky-900 border-r border-sky-800">
            {/* Header */}
            <div className="flex items-center mb-8 px-2">
                <div className="bg-white p-2 rounded-lg mr-3">
                    <MdSchool className="w-6 h-6 text-sky-900" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Uni LMS</h2>
                    <p className="text-xs text-sky-200 font-semibold">TA Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col flex-grow">
                <NavItem to="/ta-dashboard" icon={MdDashboard} label="Dashboard" />
                <NavItem to="/ta-grading" icon={MdGrade} label="Grading Support" />
                <NavItem to="/ta-labs" icon={MdScience} label="Lab Sessions" />
                <NavItem to="/ta-attendance" icon={MdPeople} label="Attendance" />
                <NavItem to="/ta-assignments" icon={MdAssignment} label="Assignments" />
            </nav>

            {/* User Profile */}
            <div className="mt-auto pt-4 border-t border-sky-800">
                <div className="flex items-center px-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                        <span className="text-sky-900 font-bold">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'T'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user.fullName || 'TA User'}</p>
                        <p className="text-sky-200 text-xs truncate">Teaching Assistant</p>
                    </div>
                    <button onClick={handleLogout} className="text-sky-200 hover:text-white" title="Sign Out">
                        <MdLogout className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
