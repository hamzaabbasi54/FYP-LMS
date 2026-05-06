import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from '../../common/staff/Sidebar.jsx';
import Navbar from '../../common/staff/Navbar.jsx';
import './stafflayout.css';

const StaffMainLayout = () => {
    return (
        <div className="staff-main-layout">
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
                    © 2026 University LMS. Need help? Contact IT Support.
                </p>
            </div>
        </div>
    );
};

export default StaffMainLayout;
