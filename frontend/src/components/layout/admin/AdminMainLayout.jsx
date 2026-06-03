import React, { useEffect } from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from '../../common/admin/Sidebar.jsx';
import Navbar from '../../common/admin/Navbar.jsx';
import { useSocket } from '../../../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import './mainlayout.css';

const AdminMainLayout = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();

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
       <div className= "main-layout">
           <div className="sidebar">
               <Sidebar/>
           </div>
           <div className="navbar">
               <Navbar/>

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