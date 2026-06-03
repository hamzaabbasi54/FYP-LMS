// ============================================
// File: frontend/src/context/SocketContext.jsx
// Socket.IO connection provider — connects when user is authenticated
// ============================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            // Disconnect if user logs out
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Extract origin (remove /api suffix if present)
        const socketUrl = API_BASE.replace(/\/api$/, '');

        const newSocket = io(socketUrl, {
            withCredentials: true, // sends HTTP-Only cookie during handshake
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected');
        });

        newSocket.on('connect_error', (err) => {
            console.error('🔌 Socket connection error:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
