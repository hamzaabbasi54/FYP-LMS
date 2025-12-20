import React from 'react';
import { Outlet } from "react-router-dom";
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import './mainlayout.css';
const MainLayout = () => {
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

export default MainLayout;