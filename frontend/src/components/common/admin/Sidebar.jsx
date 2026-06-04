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
                    flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-left transition-all duration-200 mb-1
                    ${indent ? 'ml-4' : ''}
                    ${isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-600 hover:shadow-md hover:shadow-black/20'
                    }
                `}
            >
                {({ isActive }) => (
                    <>
                        <div className="flex items-center">
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                            <span className="font-medium text-sm">{label}</span>
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
        <div className="flex flex-col w-full h-full px-4 py-6 bg-slate-900 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center mb-8 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mr-3">
                    <MdSchool className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white leading-tight">Uni LMS</h2>
                    <p className="text-xs text-slate-500 font-medium">{user.role === 'super_admin' ? 'Super Admin' : 'Director Panel'}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col">
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-3 px-4">Main</p>
                <NavItem to="/deptadmin-dashboard" icon={MdDashboard} label="Dashboard" />

                {/* User Management Section */}
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-6 mb-3 px-4">User Management</p>
                <NavItem to="/admin-manageusers" icon={MdPeople} label="Manage Users" />

                {/* Operations Section */}
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-6 mb-3 px-4">Operations</p>
                <button
                    onClick={() => setOperationsExpanded(!operationsExpanded)}
                    className={`
                        flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-left transition-all duration-200 mb-1
                        ${isOperationsActive ? 'bg-slate-600 text-white shadow-md shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-600 hover:shadow-md hover:shadow-black/20'}
                    `}
                >
                    <div className="flex items-center">
                        <MdBuild className={`w-5 h-5 mr-3`} />
                        <span className="font-medium text-sm">Operations</span>
                    </div>
                    {operationsExpanded ? (
                        <MdExpandLess className="w-5 h-5" />
                    ) : (
                        <MdExpandMore className="w-5 h-5" />
                    )}
                </button>

                {operationsExpanded && (
                    <div className="space-y-1">
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

                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-6 mb-3 px-4">Communication</p>
                <NavItem to="/admin-messages" icon={MdMessage} label="Messages" badge={unreadCount > 0 ? unreadCount : undefined} />

                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-6 mb-3 px-4">Other</p>
                <NavItem to="/admin-parents" icon={MdPeople} label="Parents" />
                <NavItem to="/admin-settings" icon={MdSettings} label="Settings" />
            </nav>

            {/* User Profile */}
            <div className="mt-auto pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.fullName || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.department || 'Department'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                    <MdLogout className="w-5 h-5 mr-3" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;