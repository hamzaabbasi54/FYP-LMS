// ============================================
// File: backend/routes/notificationRoutes.js
// Notifications CRUD
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// GET all notifications for the logged-in user
router.get('/', async (req, res) => {
    try {
        const [notifications] = await pool.query(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );
        const [[{ unread_count }]] = await pool.query(
            `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ success: true, data: notifications, unread_count });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});

// PUT mark all notifications as read
router.put('/read-all', async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: 'Error marking notifications as read' });
    }
});

export default router;
