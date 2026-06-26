// ============================================
// File: backend/routes/messageRoutes.js
// Department-scoped real-time messaging
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';
import { getIO } from '../utils/socket.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ============================================
// GET /contacts — List department members you can message
// ============================================
router.get('/contacts', async (req, res) => {
    try {
        const userId = req.user.id;
        const deptId = req.user.department_id;

        if (!deptId) {
            return res.json({ success: true, data: [] });
        }

        const cacheKey = `messages:contacts:${userId}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        const [contacts] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role,
                    d.name as department_name,
                    (SELECT COUNT(*) FROM messages m 
                     WHERE m.sender_id = u.id AND m.recipient_id = ? AND m.is_read = FALSE) as unread_count,
                    (SELECT m2.content FROM messages m2 
                     WHERE (m2.sender_id = u.id AND m2.recipient_id = ?) 
                        OR (m2.sender_id = ? AND m2.recipient_id = u.id)
                     ORDER BY m2.created_at DESC LIMIT 1) as last_message,
                    (SELECT m3.created_at FROM messages m3 
                     WHERE (m3.sender_id = u.id AND m3.recipient_id = ?) 
                        OR (m3.sender_id = ? AND m3.recipient_id = u.id)
                     ORDER BY m3.created_at DESC LIMIT 1) as last_message_time
             FROM users u
             JOIN departments d ON u.department_id = d.id
             WHERE u.department_id = ? AND u.id != ? AND u.is_active = TRUE AND u.status = 'approved'
             ORDER BY last_message_time DESC, u.full_name ASC`,
            [userId, userId, userId, userId, userId, deptId, userId]
        );

        await cacheSet(cacheKey, contacts, 86400); // Cache for 24 hours
        res.json({ success: true, data: contacts });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Error fetching contacts' });
    }
});

// ============================================
// GET /conversation/:userId — Message history with a user
// ============================================
router.get('/conversation/:userId', async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = parseInt(req.params.userId);
        const deptId = req.user.department_id;

        // Security: Verify both users share the same department
        const [otherUser] = await pool.query(
            'SELECT id, department_id, full_name FROM users WHERE id = ?',
            [otherUserId]
        );

        if (otherUser.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (otherUser[0].department_id !== deptId) {
            return res.status(403).json({ success: false, message: 'Cannot message users outside your department' });
        }

        const cacheKey = `messages:conversation:${Math.min(currentUserId, otherUserId)}:${Math.max(currentUserId, otherUserId)}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
            // Still mark as read in background
            pool.query(
                `UPDATE messages SET is_read = TRUE 
                 WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE`,
                [otherUserId, currentUserId]
            ).then(([result]) => {
                if (result.affectedRows > 0) {
                    cacheDelPattern(`messages:contacts:${otherUserId}`);
                    cacheDelPattern(`messages:contacts:${currentUserId}`);
                    cacheDelPattern(cacheKey);
                }
            }).catch(() => {});
            return res.json({ success: true, data: cached, contact: { id: otherUser[0].id, full_name: otherUser[0].full_name } });
        }

        // Fetch conversation messages
        const [messages] = await pool.query(
            `SELECT m.id, m.sender_id, m.recipient_id, m.content, m.is_read, m.created_at,
                    u.full_name as sender_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE (m.sender_id = ? AND m.recipient_id = ?)
                OR (m.sender_id = ? AND m.recipient_id = ?)
             ORDER BY m.created_at ASC
             LIMIT 200`,
            [currentUserId, otherUserId, otherUserId, currentUserId]
        );

        // Mark unread messages from this sender as read
        const [readResult] = await pool.query(
            `UPDATE messages SET is_read = TRUE 
             WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE`,
            [otherUserId, currentUserId]
        );

        if (readResult.affectedRows > 0) {
            await cacheDelPattern(`messages:contacts:${otherUserId}`);
            await cacheDelPattern(`messages:contacts:${currentUserId}`);
        }

        await cacheSet(cacheKey, messages, 86400); // 24 hours

        res.json({
            success: true,
            data: messages,
            contact: { id: otherUser[0].id, full_name: otherUser[0].full_name }
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ success: false, message: 'Error fetching conversation' });
    }
});

// ============================================
// POST /send — Send a message
// ============================================
router.post('/send', async (req, res) => {
    try {
        const senderId = req.user.id;
        const senderName = req.user.full_name || req.user.fullName || 'User';
        const deptId = req.user.department_id;
        const { recipient_id, content } = req.body;

        if (!recipient_id || !content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Recipient and content are required' });
        }

        // MED-3: Message content length limit
        if (content.trim().length > 5000) {
            return res.status(400).json({ success: false, message: 'Message too long. Maximum 5000 characters.' });
        }

        // Security: Verify recipient is in the same department
        const [recipient] = await pool.query(
            'SELECT id, department_id, full_name FROM users WHERE id = ?',
            [recipient_id]
        );

        if (recipient.length === 0) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        if (recipient[0].department_id !== deptId) {
            return res.status(403).json({ success: false, message: 'You can only message members of your department' });
        }

        // Insert message
        const [result] = await pool.query(
            `INSERT INTO messages (sender_id, recipient_id, department_id, content)
             VALUES (?, ?, ?, ?)`,
            [senderId, recipient_id, deptId, content.trim()]
        );

        const messageData = {
            id: result.insertId,
            sender_id: senderId,
            sender_name: senderName,
            recipient_id,
            content: content.trim(),
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Emit real-time WebSocket event to recipient
        try {
            const io = getIO();
            if (io) {
                const sockets = await io.in(`dept_${deptId}`).fetchSockets();
                for (const s of sockets) {
                    if (s.user?.id === recipient_id) {
                        s.emit('new_message', messageData);
                    }
                }
            }
        } catch (socketErr) {
            console.error('Socket emit error (non-blocking):', socketErr);
        }

        const cacheKey = `messages:conversation:${Math.min(senderId, recipient_id)}:${Math.max(senderId, recipient_id)}`;
        await cacheDelPattern(cacheKey);
        await cacheDelPattern(`messages:contacts:${senderId}`);
        await cacheDelPattern(`messages:contacts:${recipient_id}`);

        res.json({ success: true, data: messageData });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

// ============================================
// GET /unread-count — Total unread messages for sidebar badge
// ============================================
router.get('/unread-count', async (req, res) => {
    try {
        const [[result]] = await pool.query(
            'SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
});

// ============================================
// PUT /read/:userId — Mark all messages from a user as read
// ============================================
router.put('/read/:userId', async (req, res) => {
    try {
        const senderId = parseInt(req.params.userId);
        const currentUserId = req.user.id;

        await pool.query(
            `UPDATE messages SET is_read = TRUE 
             WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE`,
            [senderId, currentUserId]
        );

        const cacheKey = `messages:conversation:${Math.min(currentUserId, senderId)}:${Math.max(currentUserId, senderId)}`;

        await cacheDelPattern(`messages:contacts:${senderId}`);
        await cacheDelPattern(`messages:contacts:${currentUserId}`);
        await cacheDelPattern(cacheKey);

        res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: 'Error marking messages as read' });
    }
});

export default router;
