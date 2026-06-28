import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from "react-router-dom";
import { PiList } from 'react-icons/pi';
import Sidebar from '../../common/faculty/Sidebar.jsx';
import Navbar from '../../common/faculty/Navbar.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import './facultylayout.css';

const FacultyMainLayout = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const queryClient = useQueryClient();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const hideFooter = location.pathname.includes('/faculty-messages') || location.pathname === '/faculty-dashboard';

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!sidebarOpen) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setSidebarOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [sidebarOpen]);

    // Listen for real-time WebSocket events from admin
    useEffect(() => {
        if (!socket) return;

        const events = [
            'course_updated', 'course_created', 'course_deleted',
            'syllabus_updated', 'faculty_assigned', 'batch_updated'
        ];

        const handler = (data) => {
            toast.info(data.message || 'Content updated by Admin', {
                position: 'top-right',
                autoClose: 4000
            });
            // Invalidate all faculty-relevant queries so data refreshes
            queryClient.invalidateQueries({ queryKey: ['facultyDashboardCourses'] });
            queryClient.invalidateQueries({ queryKey: ['facultySchedule'] });
            queryClient.invalidateQueries({ queryKey: ['facultyAssignedCourse'] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };

        events.forEach(e => socket.on(e, handler));
        return () => events.forEach(e => socket.off(e, handler));
    }, [socket, queryClient]);

    return (
        <div className="faculty-main-layout">
            {sidebarOpen && (
                <button
                    type="button"
                    className="app-sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}
            <aside className={`sidebar app-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Faculty navigation">
                <Sidebar />
            </aside>
            <div className="navbar">
                <button
                    type="button"
                    className="mobile-menu-button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open navigation"
                    aria-expanded={sidebarOpen}
                >
                    <PiList className="h-6 w-6" />
                </button>
                <Navbar />
            </div>
            <div className="main">
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
            {!hideFooter && (
                <div className="footer">
                    <p className="text-sm text-gray-500 text-center py-4">
                        © {new Date().getFullYear()} Campus Flow. Need help? Contact IT Support.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FacultyMainLayout;
