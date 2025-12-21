import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdBook, MdSchedule, MdPeople, MdGrade, MdMessage, MdAnnouncement, MdLogout, MdSchool } from 'react-icons/md';

const Sidebar = () => {

    // The 'to' prop tells React Router where to redirect
    const NavItem = ({ icon: Icon, label, to, badge }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
          flex items-center justify-between w-full p-2 sm:p-3 rounded-lg text-left transition-colors duration-200 mb-1
          ${isActive
                    ? 'bg-blue-700 text-white'       // Style when active (lighter blue on dark)
                    : 'text-blue-100 hover:bg-blue-800' // Style when inactive
                }
        `}
            >
                {/* We use a function here to change the icon color dynamically too */}
                {({ isActive }) => (
                    <>
                        <div className="flex items-center min-w-0">
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-200'}`} />
                            <span className="font-medium text-sm sm:text-base truncate">{label}</span>
                        </div>
                        {badge && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                {badge}
                            </span>
                        )}
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col w-full h-full px-3 sm:px-4 py-6 sm:py-8 bg-blue-900 border-r">
            {/* Header */}
            <div className="flex items-center mb-6 sm:mb-8 px-2">
                <div className="bg-white p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                    <MdSchool className="w-5 h-5 sm:w-6 sm:h-6 text-blue-900" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">Eng. Faculty LMS</h2>
                    <p className="text-xs text-blue-200 font-semibold">Faculty Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col flex-grow">
                {/* The 'to' prop is the destination URL */}
                <NavItem to="/faculty-dashboard" icon={MdDashboard} label="Dashboard" />
                <NavItem to="/faculty-mycourses" icon={MdBook} label="My Courses" />
                <NavItem to="/faculty-schedule" icon={MdSchedule} label="Schedule" />
                <NavItem to="/faculty-attendance" icon={MdPeople} label="Attendance" />
                <NavItem to="/faculty-grades" icon={MdGrade} label="Grades" />

                {/* Communication Section */}
                <div className="mt-4 sm:mt-6 mb-4">
                    <div className="border-t border-blue-700 mb-3 sm:mb-4"></div>
                    <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider px-2 sm:px-3 mb-2">
                        COMMUNICATION
                    </h3>
                    <NavItem 
                        to="/faculty-messages" 
                        icon={MdMessage} 
                        label="Messages"
                        badge={3}
                    />
                    <NavItem to="/faculty-announcements" icon={MdAnnouncement} label="Announcements" />
                </div>
            </nav>

            {/* User Profile Section at Bottom */}
            <div className="mt-auto pt-4 border-t border-blue-700">
                <div className="flex items-center px-2 mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <span className="text-blue-900 font-bold text-xs sm:text-sm">JD</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs sm:text-sm truncate">John Doe</p>
                        <p className="text-blue-200 text-xs truncate">Senior Lecturer</p>
                    </div>
                    <button className="text-blue-200 hover:text-white transition-colors flex-shrink-0 ml-2">
                        <MdLogout className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

