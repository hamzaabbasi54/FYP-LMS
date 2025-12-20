import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from '../../common/admin/Sidebar.jsx';
import Navbar from '../../common/admin/Navbar.jsx';
import './mainlayout.css';
const AdminMainLayout = () => {
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