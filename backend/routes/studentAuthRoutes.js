// ============================================
// Student Auth Routes — mobile app login
// ============================================

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { cacheDel } from '../config/redis.js';
import { verifyStudentToken } from '../middleware/studentAuth.js';
import { fetchStudentProfile } from '../utils/studentAccount.js';

const router = express.Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

// POST /api/student-auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const [[account]] = await pool.query(
            `SELECT sa.*, s.is_active AS student_active
             FROM student_accounts sa
             JOIN students s ON s.id = sa.student_id
             WHERE sa.email = ?`,
            [email.toLowerCase()]
        );

        if (!account) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (!account.is_active || !account.student_active) {
            return res.status(403).json({ success: false, message: 'Account deactivated' });
        }

        const match = await bcrypt.compare(password, account.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: account.id,
                student_id: account.student_id,
                email: account.email,
                role: 'student',
                token_version: account.token_version || 0,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await pool.query('UPDATE student_accounts SET last_login = NOW() WHERE id = ?', [account.id]);
        await cacheDel(`session:student:${account.id}`);

        const user = await fetchStudentProfile(account.student_id);

        res.cookie('student_token', token, cookieOptions);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { token, user },
        });
    } catch (error) {
        console.error('Student login error:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({
                success: false,
                message: 'Student login is not configured yet. Run migration 015_add_student_accounts.sql.',
            });
        }
        res.status(500).json({ success: false, message: 'Error during login' });
    }
});

// GET /api/student-auth/me
router.get('/me', verifyStudentToken, async (req, res) => {
    try {
        const user = await fetchStudentProfile(req.student.student_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Student /me error:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// POST /api/student-auth/logout
router.post('/logout', verifyStudentToken, (req, res) => {
    res.clearCookie('student_token', cookieOptions);
    res.status(200).json({ success: true, message: 'Logged out' });
});

// PUT /api/student-auth/change-password
router.put('/change-password', verifyStudentToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
        }
        if (newPassword.length < 5) {
            return res.status(400).json({ success: false, message: 'Password must be at least 5 characters' });
        }
        if (oldPassword === newPassword) {
            return res.status(400).json({ success: false, message: 'New password must be different from current password' });
        }

        const [[account]] = await pool.query(
            'SELECT id, password, email, student_id, token_version FROM student_accounts WHERE id = ?',
            [req.student.id]
        );
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const match = await bcrypt.compare(oldPassword, account.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        const nextTokenVersion = Number(account.token_version || 0) + 1;
        await pool.query(
            'UPDATE student_accounts SET password = ?, token_version = ? WHERE id = ?',
            [hashed, nextTokenVersion, req.student.id]
        );
        await cacheDel(`session:student:${req.student.id}`);

        const token = jwt.sign(
            {
                id: account.id,
                student_id: account.student_id,
                email: account.email,
                role: 'student',
                token_version: nextTokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('student_token', token, cookieOptions);
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: { token },
        });
    } catch (error) {
        console.error('Student change-password error:', error);
        res.status(500).json({ success: false, message: 'Error changing password' });
    }
});

export default router;
