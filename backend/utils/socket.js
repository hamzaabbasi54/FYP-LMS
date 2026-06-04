// ============================================
// File: backend/utils/socket.js
// Socket.IO initialization + department room management
// ============================================

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

let io;

export const initSocket = (httpServer, allowedOrigins) => {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true
        }
    });

    io.on('connection', async (socket) => {
        // Authenticate via HTTP-Only cookie from handshake headers
        try {
            const cookieHeader = socket.request.headers.cookie || '';
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

            // MED-2: Verify user still exists and is active in DB
            const [users] = await pool.query(
                'SELECT id, role, department_id, is_active FROM users WHERE id = ?',
                [decoded.id]
            );
            if (!users.length || !users[0].is_active) {
                console.error(`Socket auth failed: User ${decoded.id} not found or inactive`);
                socket.disconnect();
                return;
            }

            // Use live DB data instead of potentially stale JWT claims
            socket.user = {
                ...decoded,
                role: users[0].role,
                department_id: users[0].department_id
            };

            // Auto-join department room
            if (socket.user.department_id) {
                socket.join(`dept_${socket.user.department_id}`);
                console.log(`🔌 Socket: ${decoded.email} (${socket.user.role}) joined dept_${socket.user.department_id}`);
            }
        } catch (err) {
            console.error('Socket auth failed:', err.message);
            socket.disconnect();
            return;
        }

        // Typing indicator — forward to recipient only
        socket.on('typing', ({ recipientId }) => {
            if (!socket.user?.department_id || !recipientId) return;
            const room = `dept_${socket.user.department_id}`;
            const roomSockets = io.sockets.adapter.rooms.get(room);
            if (roomSockets) {
                for (const socketId of roomSockets) {
                    const s = io.sockets.sockets.get(socketId);
                    if (s?.user?.id === recipientId) {
                        s.emit('user_typing', {
                            senderId: socket.user.id,
                            senderName: socket.user.full_name || socket.user.email
                        });
                    }
                }
            }
        });

        socket.on('stop_typing', ({ recipientId }) => {
            if (!socket.user?.department_id || !recipientId) return;
            const room = `dept_${socket.user.department_id}`;
            const roomSockets = io.sockets.adapter.rooms.get(room);
            if (roomSockets) {
                for (const socketId of roomSockets) {
                    const s = io.sockets.sockets.get(socketId);
                    if (s?.user?.id === recipientId) {
                        s.emit('user_stop_typing', { senderId: socket.user.id });
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.user?.email || 'unknown'}`);
        });
    });

    return io;
};

export const getIO = () => io;
