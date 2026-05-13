import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from '../../common/faculty/Sidebar.jsx';
import Navbar from '../../common/faculty/Navbar.jsx';
import './facultylayout.css';

const FacultyMainLayout = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const facultyName = user.faculty || 'Faculty';

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