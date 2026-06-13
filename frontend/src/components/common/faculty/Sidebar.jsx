import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdBook, MdSchedule, MdPeople, MdGrade, MdMessage, MdNotifications, MdLogout, MdSchool } from 'react-icons/md';
import { useCourse } from '../../../context/CourseContext';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '../../../services/api';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedCourse } = useCourse();
    const { user, logout } = useAuth();
    const socket = useSocket();
    const queryClient = useQueryClient();

    const { data: unreadData } = useQuery({
        queryKey: ['unreadMessageCount'],
        queryFn: async () => {
            const res = await messageApi.getUnreadCount();
            return res.success ? res.count : 0;
        },
        refetchInterval: 30000,
    });
    const unreadCount = unreadData || 0;

    // Listen for new_message socket events to update badge
    React.useEffect(() => {
        if (!socket) return;
        const handler = () => {
            queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
        };
        socket.on('new_message', handler);
        return () => socket.off('new_message', handler);
    }, [socket, queryClient]);

    // Get logged-in user data from AuthContext
    const facultyName = user?.faculty || 'Faculty';
    const professorName = user?.fullName || 'Professor';
    const professorInitials = professorName
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Handle logout
    const handleLogout = () => {
        logout();
    };

    // The 'to' prop tells React Router where to redirect
    const NavItem = ({ icon: Icon, label, to, badge, matchPaths, excludePaths, disabled }) => {
        // Check if current path matches any of the matchPaths (for nested routes)
        const isActiveRoute = matchPaths
            ? matchPaths.some(path => location.pathname.includes(path))
            : false;

        // Check if current path should be excluded
        const isExcluded = excludePaths
            ? excludePaths.some(path => location.pathname.includes(path))
            : false;

        const baseClasses = "flex items-center justify-between w-full h-9 px-3 rounded-lg text-sm transition-all duration-200 mb-1";

        if (disabled) {
            return (
                <div className={`${baseClasses} text-slate-400 cursor-not-allowed opacity-50 font-medium`}>
                    <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-5 h-5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{label}</span>
                    </div>
                </div>
            );
        }

        return (
            <NavLink
                to={to}
                className={({ isActive }) => {
                    // Don't highlight if path is excluded
                    const active = !isExcluded && (isActive || isActiveRoute);
                    return `
                        ${baseClasses}
                        ${active
                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }
                    `;
                }}
            >
                {/* We use a function here to change the icon color dynamically too */}
                {({ isActive }) => {
                    const active = !isExcluded && (isActive || isActiveRoute);
                    return (
                        <>
                            <div className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
                                <span className="truncate">{label}</span>
                            </div>
                            {badge && (
                                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    {badge > 9 ? '9+' : badge}
                                </span>
                            )}
                        </>
                    );
                }}
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col w-full h-full px-3 sm:px-4 py-6 sm:py-8 bg-white border-r border-gray-200">
            {/* Header */}
            <div className="flex items-center mb-6 sm:mb-8 px-2">
                <div className="bg-blue-600 p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                    <MdSchool className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 leading-tight truncate">{facultyName} LMS</h2>
                    <p className="text-xs text-gray-500 font-semibold">Faculty Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col flex-grow">
                {/* The 'to' prop is the destination URL */}
                <NavItem to="/faculty-dashboard" icon={MdDashboard} label="Dashboard" />
                <NavItem
                    to={selectedCourse ? `/faculty-mycourses/${selectedCourse.assignment_id}` : '/faculty-dashboard'}
                    icon={MdBook}
                    label="My Courses"
                    matchPaths={['/faculty-mycourses']}
                    excludePaths={['/faculty-mycourses/grading', '/grading']}
                    disabled={!selectedCourse}
                />
                <NavItem
                    to="/faculty-attendance"
                    icon={MdPeople}
                    label="Attendance"
                    matchPaths={['/faculty-attendance/monthly-report']}
                    disabled={!selectedCourse}
                />
                <NavItem
                    to={selectedCourse ? `/faculty-mycourses/${selectedCourse.assignment_id}/grading` : '/faculty-dashboard'}
                    icon={MdGrade}
                    label="Grades"
                    matchPaths={['/grading']}
                    disabled={!selectedCourse}
                />

                {/* Communication Section */}
                <div className="mt-4 sm:mt-6 mb-4">
                    <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-5 mb-1 px-3">
                        COMMUNICATION
                    </p>
                    <NavItem
                        to="/faculty-messages"
                        icon={MdMessage}
                        label="Messages"
                        badge={unreadCount > 0 ? unreadCount : undefined}
                    />
                    <NavItem to="/faculty-schedule" icon={MdSchedule} label="Schedule" />
                    <NavItem to="/faculty-notifications" icon={MdNotifications} label="Notifications" />
                </div>
            </nav>

            {/* User Profile Section at Bottom */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex items-center px-2 mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <span className="text-blue-600 font-bold text-xs sm:text-sm">{professorInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-semibold text-xs sm:text-sm truncate">{professorName}</p>
                        <p className="text-gray-500 text-xs truncate capitalize">{user.role || 'Faculty'}</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                        title="Logout"
                    >
                        <MdLogout className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;