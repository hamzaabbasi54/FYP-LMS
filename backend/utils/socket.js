// ============================================
// File: backend/utils/socket.js
// Socket.IO initialization + department room management
// ============================================

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (httpServer, allowedOrigins) => {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        // Authenticate via HTTP-Only cookie from handshake headers
        try {
            const cookieHeader = socket.request.headers.cookie || '';
            // Parse cookies manually (cookie-parser doesn't apply to socket handshake)
            const cookies = {};
            cookieHeader.split(';').forEach(cookie => {
                const [name, ...rest] = cookie.trim().split('=');
                if (name) cookies[name.trim()] = rest.join('=').trim();
            });

            const token = cookies.token;
            if (!token) {
                console.error('Socket auth failed: No token cookie');
                socket.disconnect();
                return;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;

            // Auto-join department room
            if (decoded.department_id) {
                socket.join(`dept_${decoded.department_id}`);
                console.log(`🔌 Socket: ${decoded.email} (${decoded.role}) joined dept_${decoded.department_id}`);
            }
        } catch (err) {
            console.error('Socket auth failed:', err.message);
            socket.disconnect();
            return;
        }

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.user?.email || 'unknown'}`);
        });
    });

    return io;
};

export const getIO = () => io;
