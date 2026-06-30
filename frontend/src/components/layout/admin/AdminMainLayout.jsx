import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from "react-router-dom";
import { PiList } from 'react-icons/pi';
import Sidebar from '../../common/admin/Sidebar.jsx';
import Navbar from '../../common/admin/Navbar.jsx';
import { useSocket } from '../../../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import './mainlayout.css';

const AdminMainLayout = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    useEffect(() => {
        if (!socket) return;

        // Course events → invalidate admin course queries
        const handleCourse = () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        };

        // Batch events → invalidate admin batch queries
        const handleBatch = () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        };

        // Faculty assignment events → invalidate batch/faculty queries
        const handleFacultyAssign = () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            queryClient.invalidateQueries({ queryKey: ['faculty'] });
        };

        socket.on('course:created', handleCourse);
        socket.on('course:updated', handleCourse);
        socket.on('course:deleted', handleCourse);

        socket.on('batch:created', handleBatch);
        socket.on('batch:updated', handleBatch);
        socket.on('batch:deleted', handleBatch);

        socket.on('batch:faculty_assigned', handleFacultyAssign);
        socket.on('batch:faculty_removed', handleFacultyAssign);

        return () => {
            socket.off('course:created', handleCourse);
            socket.off('course:updated', handleCourse);
            socket.off('course:deleted', handleCourse);
            socket.off('batch:created', handleBatch);
            socket.off('batch:updated', handleBatch);
            socket.off('batch:deleted', handleBatch);
            socket.off('batch:faculty_assigned', handleFacultyAssign);
            socket.off('batch:faculty_removed', handleFacultyAssign);
        };
    }, [socket, queryClient]);

    return (
        <div className="main-layout bg-slate-50">
            {sidebarOpen && (
                <button
                    type="button"
                    className="app-sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}
            <aside className={`sidebar app-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Department admin navigation">
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
        </div>
    );
};

export default AdminMainLayout;
