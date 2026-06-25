import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from "react-router-dom";
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const touchStartX = useRef(null);
    const hideFooter = location.pathname.includes('/faculty-messages') || location.pathname === '/faculty-dashboard';

    const handleSidebarTouchStart = (event) => {
        touchStartX.current = event.touches?.[0]?.clientX ?? null;
    };

    const handleSidebarTouchEnd = (event) => {
        if (touchStartX.current === null) return;
        const endX = event.changedTouches?.[0]?.clientX ?? touchStartX.current;
        if (touchStartX.current - endX > 48) {
            setIsSidebarOpen(false);
        }
        touchStartX.current = null;
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

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
        <div className={`faculty-main-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <button
                type="button"
                className="mobile-sidebar-backdrop"
                aria-label="Close navigation"
                onClick={() => setIsSidebarOpen(false)}
            />
            <div
                className="sidebar"
                onTouchStart={handleSidebarTouchStart}
                onTouchEnd={handleSidebarTouchEnd}
            >
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
            <div className="navbar">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
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
