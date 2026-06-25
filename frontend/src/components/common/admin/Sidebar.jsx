import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    PiAddressBook,
    PiBookOpenText,
    PiBooks,
    PiCaretDown,
    PiCaretUp,
    PiChatsCircle,
    PiCompass,
    PiFolders,
    PiGauge,
    PiGraduationCap,
    PiLinkSimple,
    PiListChecks,
    PiSignOut,
    PiTarget,
    PiUsersThree,
} from 'react-icons/pi';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messageApi } from '../../../services/api';
import campusFlowLogo from '../../../assets/campus-flow-logo-clean.svg';

const Sidebar = ({ onClose }) => {
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
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
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
                        ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-500 shadow-sm'
                        : isActive && indent
                            ? 'text-sky-700 font-medium bg-sky-50'
                            : ''
                    }
                `}
            >
                {({ isActive }) => (
                    <>
                        <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 stroke-[1.8] ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
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
        <div className="flex flex-col w-full h-full px-4 py-4 bg-white/82 backdrop-blur-xl border-r border-sky-100 overflow-y-auto shadow-sm">
            {/* Logo */}
            <div className="mb-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/80 px-3 py-3 shadow-sm">
                <img src={campusFlowLogo} alt="Campus Flow" className="h-9 w-40 object-contain object-left" />
                <div>
                    <p className="mt-2 text-xs font-medium text-slate-500">{user.role === 'super_admin' ? 'Super Admin' : 'Department Admin'}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col">
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-2 mb-1 px-3">Main</p>
                <NavItem to="/deptadmin-dashboard" icon={PiGauge} label="Dashboard" />

                {/* User Management Section */}
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-4 mb-1 pt-3 border-t border-slate-200 px-3">User Management</p>
                <NavItem to="/admin-manageusers" icon={PiUsersThree} label="Manage Users" />

                {/* Operations Section */}
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-4 mb-1 pt-3 border-t border-slate-200 px-3">Operations</p>
                <button
                    onClick={() => setOperationsExpanded(!operationsExpanded)}
                    className={`
                        flex items-center justify-between w-full h-9 px-3 rounded-lg text-left transition-all duration-200 mb-1
                        ${isOperationsActive ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-500 shadow-sm' : 'text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                >
                    <div className="flex items-center gap-2">
                        <PiCompass className={`w-5 h-5 ${isOperationsActive ? 'text-sky-700' : 'text-slate-400'}`} />
                        <span className="text-sm">Operations</span>
                    </div>
                    {operationsExpanded ? (
                        <PiCaretUp className={`w-5 h-5 ${isOperationsActive ? 'text-sky-700' : 'text-slate-400'}`} />
                    ) : (
                        <PiCaretDown className={`w-5 h-5 ${isOperationsActive ? 'text-sky-700' : 'text-slate-400'}`} />
                    )}
                </button>

                {operationsExpanded && (
                    <div className="ml-3 border-l-2 border-slate-100 pl-2 mt-1 flex flex-col gap-0.5">
                        <NavItem to="/admin-managebatches" icon={PiFolders} label="Batches" indent />
                        <NavItem to="/admin-managecourses" icon={PiBooks} label="Courses" indent />
                        <NavItem to="/admin-curricula" icon={PiBookOpenText} label="Curricula" indent />
                        <NavItem to="/admin-managefaculty" icon={PiGraduationCap} label="Faculty" indent />
                        <NavItem to="/admin-obe" icon={PiTarget} label="OBE" indent />
                        <NavItem to="/admin-managecourses/plos" icon={PiListChecks} label="PLOs" indent />
                        <NavItem to="/admin-managecourses/clos" icon={PiListChecks} label="CLOs" indent />
                        <NavItem to="/admin-external-links" icon={PiLinkSimple} label="Links" indent />
                    </div>
                )}

                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-4 mb-1 pt-3 border-t border-slate-200 px-3">Communication</p>
                <NavItem to="/admin-messages" icon={PiChatsCircle} label="Messages" badge={unreadCount > 0 ? unreadCount : undefined} />

                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-4 mb-1 pt-3 border-t border-slate-200 px-3">Other</p>
                <NavItem to="/admin-parents" icon={PiAddressBook} label="Parents" />
            </nav>

            {/* User Profile */}
            <div className="mt-4 pt-3 border-t border-slate-200">
                <Link 
                    to="/admin-settings" 
                    onClick={(event) => {
                        event.stopPropagation();
                        onClose?.();
                    }}
                    className="flex items-center gap-3 p-2 mb-2 rounded-xl hover:bg-sky-50 transition-colors group cursor-pointer"
                    title="Account Settings"
                >
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                        <span className="text-sky-700 font-bold text-sm">
                            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-sky-700 transition-colors">{user.fullName || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.department || 'Department'}</p>
                    </div>
                </Link>
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                    <PiSignOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-500" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
