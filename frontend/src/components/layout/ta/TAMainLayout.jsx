import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../common/ta/Sidebar.jsx';
import Navbar from '../../common/ta/Navbar.jsx';
import './talayout.css';

const TAMainLayout = () => {
    return (
        <div className="ta-main-layout">
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

export default TAMainLayout;
