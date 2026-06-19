import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRole, allowedRoles }) => {
    const { user } = useAuth();

    // Check if user is logged in
    if (!user) {
        // Not logged in, redirect to login page
        return <Navigate to="/" replace />;
    }

    // Check if user has the correct role
    // Support both single role (allowedRole) and multiple roles (allowedRoles)
    const roles = allowedRoles || (allowedRole ? [allowedRole] : null);

    if (roles && !roles.includes(user.role)) {
        // Wrong role, redirect to login page
        return <Navigate to="/" replace />;
    }

    // User is authenticated and has correct role, render child routes
    return <Outlet />;
};

export default ProtectedRoute;
