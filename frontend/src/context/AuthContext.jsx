// ============================================
// File: frontend/src/context/AuthContext.jsx
// Global auth state with HTTP-Only cookie verification
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // On mount: check if user is authenticated via cookie
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await authApi.getMe();
                if (data.success) setUser(data.data);
            } catch (err) {
                // 401 = not logged in, that's fine
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();

        // Listen for forced logout from axios 401 interceptor
        const handleForceLogout = () => {
            queryClient.clear();
            setUser(null);
            localStorage.removeItem('selectedFacultyCourse');
            navigate('/');
        };
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, [navigate, queryClient]);

    const login = async (email, password, role, rememberMe = false) => {
        const data = await authApi.login(email, password, role, rememberMe);
        if (data.success) {
            queryClient.clear();
            localStorage.removeItem('selectedFacultyCourse');
            setUser(data.data);
        }
        return data;
    };

    const logout = async () => {
        try { await authApi.logout(); } catch {}
        queryClient.clear();
        setUser(null);
        localStorage.removeItem('selectedFacultyCourse');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
