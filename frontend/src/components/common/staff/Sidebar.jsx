import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    MdDashboard,
    MdBook,
    MdAssignment,
    MdGrade,
    MdPeople,
    MdScience,
    MdAssessment,
    MdFolder,
    MdSchool,
    MdLogout,
    MdCalendarMonth
} from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const permissions = user?.permissions || [];

    const handleLogout = () => {
        logout();
    };

    // Check if user has any permission starting with prefix
    const hasPermission = (prefix) => {
        return permissions.some(p => p.startsWith(prefix));
    };

    // Role labels for display
    const roleLabels = {
        course_coordinator: 'Course Coordinator',
        ta: 'Teaching Assistant',
        faculty: 'Faculty'
    };

    const NavItem = ({ icon: Icon, label, to, matchPaths }) => {
        const isActiveRoute = matchPaths
            ? matchPaths.some(path => location.pathname.includes(path))
            : false;

        return (
            <NavLink
                to={to}
                className={({ isActive }) => {
                    const active = isActive || isActiveRoute;
                    return `
                        flex items-center justify-between w-full p-2 sm:p-3 rounded-lg text-left transition-colors duration-200 mb-1
                        ${active
                            ? 'bg-emerald-700 text-white'
                            : 'text-emerald-100 hover:bg-emerald-800'
                        }
                    `;
                }}
            >
                {({ isActive }) => {
                    const active = isActive || isActiveRoute;
                    return (
                        <div className="flex items-center min-w-0">
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-4 flex-shrink-0 ${active ? 'text-white' : 'text-emerald-200'}`} />
                            <span className="font-medium text-sm sm:text-base truncate">{label}</span>
                        </div>
                    );
                }}
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col w-full h-full px-3 sm:px-4 py-6 sm:py-8 bg-emerald-900 border-r">
            {/* Header */}
            <div className="flex items-center mb-6 sm:mb-8 px-2">
                <div className="bg-white p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                    <MdSchool className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-900" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">Uni LMS</h2>
                    <p className="text-xs text-emerald-200 font-semibold">{roleLabels[user.role] || 'Staff Panel'}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col flex-grow">
                {/* Dashboard - Always visible */}
                <NavItem to="/staff-dashboard" icon={MdDashboard} label="Dashboard" />

                {/* Conditional menu items based on permissions */}
                {hasPermission('batches') && (
                    <NavItem to="/staff-batches" icon={MdCalendarMonth} label="Batches" />
                )}

                {hasPermission('courses') && (
                    <NavItem to="/staff-courses" icon={MdBook} label="Courses" />
                )}

                {hasPermission('materials') && (
                    <NavItem to="/staff-materials" icon={MdFolder} label="Course Materials" />
                )}

                {hasPermission('assignments') && (
                    <NavItem to="/staff-assignments" icon={MdAssignment} label="Assignments" />
                )}

                {(hasPermission('grades') || permissions.includes('assignments.grade')) && (
                    <NavItem to="/staff-grading" icon={MdGrade} label="Grading" />
                )}

                {hasPermission('attendance') && (
                    <NavItem to="/staff-attendance" icon={MdPeople} label="Attendance" />
                )}

                {hasPermission('students') && (
                    <NavItem to="/staff-students" icon={MdPeople} label="Students" />
                )}

                {hasPermission('labs') && (
                    <NavItem to="/staff-labs" icon={MdScience} label="Lab Sessions" />
                )}

                {hasPermission('reports') && (
                    <NavItem to="/staff-reports" icon={MdAssessment} label="Reports" />
                )}
            </nav>

            {/* User Profile Section at Bottom */}
            <div className="mt-auto pt-4 border-t border-emerald-700">
                <div className="flex items-center px-2 mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <span className="text-emerald-900 font-bold text-xs sm:text-sm">
                            {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs sm:text-sm truncate">{user.fullName || 'Staff'}</p>
                        <p className="text-emerald-200 text-xs truncate">{user.department || 'Department'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-emerald-200 hover:text-white transition-colors flex-shrink-0 ml-2"
                        title="Sign Out"
                    >
                        <MdLogout className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
