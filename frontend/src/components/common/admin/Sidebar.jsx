import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdPeople, MdAssignment, MdBook, MdSchool, MdBarChart, MdSettings } from 'react-icons/md';

const Sidebar = () => {

    // The 'to' prop tells React Router where to redirect
    const NavItem = ({ icon: Icon, label, to }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
          flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 mb-1
          ${isActive
                    ? 'bg-blue-100 text-blue-700'       // Style when active
                    : 'text-gray-600 hover:bg-gray-100' // Style when inactive
                }
        `}
            >
                {/* We use a function here to change the icon color dynamically too */}
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
                {/* The 'to' prop is the destination URL */}
                <NavItem to="/" icon={MdDashboard} label="Dashboard" />
                <NavItem to="/admin-managebatches" icon={MdPeople} label="Manage Batches" />
                <NavItem to="/admin-courseassignment" icon={MdAssignment} label="Course Assignment" />
                <NavItem to="/admin-managecourses" icon={MdBook} label="Manage Courses" />
                <NavItem to="/admin-managefaculty" icon={MdSchool} label="Manage Faculty" />
                <NavItem to="/admin-reports" icon={MdBarChart} label="Reports" />
                <NavItem to="/admin-settings" icon={MdSettings} label="Settings" />
            </nav>
        </div>
    );
};

export default Sidebar;