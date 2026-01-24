import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../common/dean/Sidebar.jsx';
import Navbar from '../../common/dean/Navbar.jsx';
import '../admin/mainlayout.css';

const DeanMainLayout = () => {
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

export default DeanMainLayout;
