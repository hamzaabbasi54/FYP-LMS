// ============================================
// File: backend/routes/notificationRoutes.js
// Notifications CRUD + Computed Notifications
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// GET all notifications for the logged-in user (stored + computed)
router.get('/', async (req, res) => {
    try {
        // 1. Fetch stored notifications from DB
        const [stored] = await pool.query(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );

        // 2. Compute live notifications (not stored in DB)
        const computed = [];

        // 2a. Unread messages
        try {
            const [[{ unread_msgs }]] = await pool.query(
                'SELECT COUNT(*) as unread_msgs FROM messages WHERE recipient_id = ? AND is_read = FALSE',
                [req.user.id]
            );
            if (unread_msgs > 0) {
                computed.push({
                    id: `computed-msg-unread`,
                    type: 'unread_messages',
                    title: 'Unread Messages',
                    message: `You have ${unread_msgs} unread message${unread_msgs > 1 ? 's' : ''}.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Computed notification (messages) error:', err.message);
        }

        // 2b. Ungraded assessments (past due date, not yet graded)
        try {
            const [ungraded] = await pool.query(`
                SELECT a.id, a.title, c.code
                FROM assessments a
                JOIN course_assignments ca ON a.course_assignment_id = ca.id
                JOIN courses c ON ca.course_id = c.id
                WHERE ca.faculty_id = ?
                  AND a.due_date < NOW()
                  AND a.status IN ('published', 'needs_grading')
                  AND a.is_deleted = FALSE
            `, [req.user.id]);

            for (const u of ungraded) {
                computed.push({
                    id: `computed-ungraded-${u.id}`,
                    type: 'ungraded_assessment',
                    title: 'Ungraded Assessment',
                    message: `"${u.title}" for ${u.code} is past due and needs grading.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Computed notification (ungraded) error:', err.message);
        }

        // 2c. Missing attendance today
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[now.getDay()];

            const [missing] = await pool.query(`
                SELECT c.code, c.title, cs.start_time
                FROM class_schedules cs
                JOIN courses c ON cs.course_id = c.id
                JOIN course_assignments ca ON ca.course_id = cs.course_id AND ca.faculty_id = cs.faculty_id
                JOIN semesters sem ON ca.semester_id = sem.id
                JOIN batches b ON sem.batch_id = b.id AND b.status = 'active'
                WHERE cs.faculty_id = ?
                  AND cs.day_of_week = ?
                  AND NOT EXISTS (
                      SELECT 1 FROM attendance att
                      WHERE att.course_assignment_id = ca.id AND att.date = ?
                  )
            `, [req.user.id, dayName, today]);

            for (const m of missing) {
                computed.push({
                    id: `computed-attend-${m.code}`,
                    type: 'missing_attendance',
                    title: 'Attendance Not Taken',
                    message: `You haven't marked attendance for ${m.code}: ${m.title} today.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('Computed notification (attendance) error:', err.message);
        }

        // 3. Merge: computed first, then stored
        const allNotifications = [...computed, ...stored];

        // 4. Count unread (stored only — computed are always unread)
        const storedUnread = stored.filter(n => !n.is_read).length;
        const totalUnread = storedUnread + computed.length;

        res.json({ success: true, data: allNotifications, unread_count: totalUnread });
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
