import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../common/superadmin/Sidebar.jsx';
import Navbar from '../../common/superadmin/Navbar.jsx';
import '../admin/mainlayout.css';

const SuperAdminMainLayout = () => {
    return (
        <div className="main-layout">
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
        </div>
    );
};

export default SuperAdminMainLayout;
