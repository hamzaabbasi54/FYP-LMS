import React, { useEffect } from 'react';
import { Outlet } from "react-router-dom";
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
    const facultyName = user?.faculty || 'Faculty';

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
            <div className="sidebar">
                <Sidebar />
            </div>
            <div className="navbar">
                <Navbar />
            </div>
            <div className="main">
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
            {/* Footer - Fixed at bottom */}
            <div className="footer">
                <p className="text-sm text-gray-500 text-center py-4">
                    © {new Date().getFullYear()} {facultyName} LMS. Need help? Contact IT Support.
                </p>
            </div>
        </div>
    );
};

export default FacultyMainLayout;