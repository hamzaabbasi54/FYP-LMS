import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Check if user is logged in
    if (!token || !user) {
        // Not logged in, redirect to login page
        return <Navigate to="/" replace />;
    }

    // Check if user has the correct role
    if (allowedRole && user.role !== allowedRole) {
        // Wrong role, redirect to login page
        return <Navigate to="/" replace />;
    }

    // User is authenticated and has correct role, render child routes
    return <Outlet />;
};

export default ProtectedRoute;
