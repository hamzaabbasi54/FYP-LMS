import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdAssignment, MdBook, MdSchool, MdBarChart, MdSettings, MdExpandMore, MdExpandLess, MdBuild, MdLink, MdTrackChanges } from 'react-icons/md';

const Sidebar = () => {
    const location = useLocation();
    const [operationsExpanded, setOperationsExpanded] = useState(true);

    // Check if any operations path is active
    const isOperationsActive = ['/admin-managebatches', '/admin-courseassignment', '/admin-managecourses', '/admin-managefaculty', '/admin-obe', '/admin-external-links']
        .some(path => location.pathname.startsWith(path));

    // The 'to' prop tells React Router where to redirect
    const NavItem = ({ icon: Icon, label, to, indent = false }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
                    flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 mb-1
                    ${indent ? 'pl-5' : ''}
                    ${isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
            >
                {({ isActive }) => (
                    <>
                        <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
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
                <div className="bg-green-800 p-2 rounded-lg text-white mr-3">
                    <MdSchool className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">University LMS</h2>
                    <p className="text-xs text-gray-500 font-semibold">Admin Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col">
                {/* Dashboard */}
                <NavItem to="/admin-dashboard" icon={MdDashboard} label="Dashboard" />

                {/* Operations Section */}
                <button
                    onClick={() => setOperationsExpanded(!operationsExpanded)}
                    className={`
                        flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors duration-200 mb-1
                        ${isOperationsActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
                    `}
                >
                    <div className="flex items-center">
                        <MdBuild className={`w-5 h-5 mr-4 ${isOperationsActive ? 'text-blue-700' : 'text-gray-500'}`} />
                        <span className="font-medium">Operations</span>
                    </div>
                    {operationsExpanded ? (
                        <MdExpandLess className="w-5 h-5 text-gray-500" />
                    ) : (
                        <MdExpandMore className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {/* Operations Sub-items */}
                {operationsExpanded && (
                    <>
                        <NavItem to="/admin-managebatches" icon={MdPeople} label="Manage Batches" indent />
                        <NavItem to="/admin-courseassignment" icon={MdAssignment} label="Course Assignment" indent />
                        <NavItem to="/admin-managecourses" icon={MdBook} label="Manage Courses" indent />
                        <NavItem to="/admin-managefaculty" icon={MdSchool} label="Manage Faculty" indent />
                        <NavItem to="/admin-obe" icon={MdTrackChanges} label="OBE" indent />
                        <NavItem to="/admin-external-links" icon={MdLink} label="External Links" indent />
                    </>
                )}

                {/* Other Items */}
                <NavItem to="/admin-reports" icon={MdBarChart} label="Reports" />
                <NavItem to="/admin-settings" icon={MdSettings} label="Settings" />
            </nav>
        </div>
    );
};

export default Sidebar;