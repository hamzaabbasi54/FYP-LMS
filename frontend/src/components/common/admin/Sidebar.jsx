import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdAssignment, MdBook, MdSchool, MdSettings, MdExpandMore, MdExpandLess, MdBuild, MdLink, MdTrackChanges, MdLogout, MdMenuBook, MdAdminPanelSettings, MdMessage } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '../../../services/api';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [operationsExpanded, setOperationsExpanded] = useState(true);
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

    const isOperationsActive = ['/admin-managebatches', '/admin-courseassignment', '/admin-managecourses', '/admin-managefaculty', '/admin-obe', '/admin-external-links', '/admin-curricula']
        .some(path => location.pathname.startsWith(path));

    const handleLogout = () => {
        logout();
    };

    const NavItem = ({ icon: Icon, label, to, indent = false, badge }) => {
        return (
            <NavLink
                to={to}
                className={({ isActive }) => `
                    ${indent 
                        ? 'flex items-center justify-between w-full text-sm font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-all duration-200 mb-0.5' 
                        : 'flex items-center justify-between w-full h-9 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 mb-1'}
                    ${isActive && !indent
                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                        : isActive && indent
                        ? 'text-blue-700 font-medium bg-blue-50'
                        : ''
                    }
                `}
            >
                {({ isActive }) => (
                    <>
                        <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                            <span className="text-sm">{label}</span>
                        </div>
                        {badge && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {badge > 9 ? '9+' : badge}
                            </span>
                        )}
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col w-full h-full px-4 py-6 bg-white border-r border-slate-200 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center mb-8 px-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                    <MdSchool className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">Uni LMS</h2>
                    <p className="text-xs text-slate-500 font-medium">{user.role === 'super_admin' ? 'Super Admin' : 'Director Panel'}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col">
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-5 mb-1 px-3">Main</p>
                <NavItem to="/deptadmin-dashboard" icon={MdDashboard} label="Dashboard" />

                {/* User Management Section */}
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-5 mb-1 px-3">User Management</p>
                <NavItem to="/admin-manageusers" icon={MdPeople} label="Manage Users" />

                {/* Operations Section */}
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-5 mb-1 px-3">Operations</p>
                <button
                    onClick={() => setOperationsExpanded(!operationsExpanded)}
                    className={`
                        flex items-center justify-between w-full h-9 px-3 rounded-lg text-left transition-all duration-200 mb-1
                        ${isOperationsActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                >
                    <div className="flex items-center gap-2">
                        <MdBuild className={`w-5 h-5 ${isOperationsActive ? 'text-blue-700' : 'text-slate-400'}`} />
                        <span className="text-sm">Operations</span>
                    </div>
                    {operationsExpanded ? (
                        <MdExpandLess className={`w-5 h-5 ${isOperationsActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    ) : (
                        <MdExpandMore className={`w-5 h-5 ${isOperationsActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    )}
                </button>

                {operationsExpanded && (
                    <div className="ml-3 border-l-2 border-slate-100 pl-2 mt-1 flex flex-col gap-0.5">
                        <NavItem to="/admin-managebatches" icon={MdPeople} label="Batches" indent />
                        <NavItem to="/admin-managecourses" icon={MdBook} label="Courses" indent />
                        <NavItem to="/admin-curricula" icon={MdMenuBook} label="Curricula" indent />
                        <NavItem to="/admin-managefaculty" icon={MdSchool} label="Faculty" indent />
                        <NavItem to="/admin-obe" icon={MdTrackChanges} label="OBE" indent />
                        <NavItem to="/admin-managecourses/plos" icon={MdTrackChanges} label="PLOs" indent />
                        <NavItem to="/admin-managecourses/clos" icon={MdTrackChanges} label="CLOs" indent />
                        <NavItem to="/admin-external-links" icon={MdLink} label="Links" indent />
                    </div>
                )}

                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-5 mb-1 px-3">Communication</p>
                <NavItem to="/admin-messages" icon={MdMessage} label="Messages" badge={unreadCount > 0 ? unreadCount : undefined} />

                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-5 mb-1 px-3">Other</p>
                <NavItem to="/admin-parents" icon={MdPeople} label="Parents" />
                <NavItem to="/admin-settings" icon={MdSettings} label="Settings" />
            </nav>

            {/* User Profile */}
            <div className="mt-auto pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-sm">
                            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.department || 'Department'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                    <MdLogout className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;