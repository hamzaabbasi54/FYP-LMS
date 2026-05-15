// ============================================
// File: backend/routes/auth.js
// Auth Routes — MySQL Version
// ============================================

import express from 'express';
import bcrypt from 'bcrypt';
import { signup, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import pool from '../config/db.js';
import { sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected route
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

// Get faculties list (from DB now, not hardcoded)
router.get('/faculties', async (req, res) => {
    try {
        const [faculties] = await pool.query(
            'SELECT id, name FROM faculties ORDER BY name'
        );
        res.status(200).json({
            success: true,
            data: faculties
        });
    } catch (error) {
        console.error('Get faculties error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching faculties'
        });
    }
});

// Get departments for a faculty (by faculty name or id)
router.get('/departments/:faculty', async (req, res) => {
    try {
        const param = req.params.faculty;

        // Support lookup by ID (numeric) or name (string)
        let query, values;
        if (!isNaN(param)) {
            query = 'SELECT d.id, d.name FROM departments d WHERE d.faculty_id = ? ORDER BY d.name';
            values = [parseInt(param)];
        } else {
            query = `SELECT d.id, d.name FROM departments d
                     JOIN faculties f ON d.faculty_id = f.id
                     WHERE f.name = ? ORDER BY d.name`;
            values = [param];
        }

        const [departments] = await pool.query(query, values);
        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments'
        });
    }
});

// Get all departments (with faculty name)
router.get('/departments', async (req, res) => {
    try {
        const [departments] = await pool.query(
            `SELECT d.id, d.name, d.faculty_id, f.name as faculty_name
             FROM departments d
             JOIN faculties f ON d.faculty_id = f.id
             ORDER BY f.name, d.name`
        );
        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Get all departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments'
        });
    }
});

// =====================================================
// ADMIN-ONLY USER MANAGEMENT ENDPOINTS
// =====================================================

// POST /api/auth/create-account — Admin creates a pre-approved user
router.post('/create-account', verifyToken, isAdmin, async (req, res) => {
    try {
        const { fullName, email, password, role, department, faculty, phoneNumber, permissions, isActive } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, password, and role are required'
            });
        }

        // Validate role
        if (!['deptadmin', 'faculty'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be deptadmin or faculty'
            });
        }

        // Check duplicate email
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Resolve department_id from department name (if provided)
        let departmentId = null;
        let facultyId = null;

        if (department) {
            const [deptRows] = await pool.query(
                'SELECT id, faculty_id FROM departments WHERE name = ?', [department]
            );
            if (deptRows.length > 0) {
                departmentId = deptRows[0].id;
                facultyId = deptRows[0].faculty_id;
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Admin-created accounts are pre-approved
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password, role, faculty_id, department_id, phone_number, status, is_active, approved_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
            [
                fullName.trim(),
                email.toLowerCase(),
                hashedPassword,
                role,
                facultyId,
                departmentId,
                phoneNumber || '',
                isActive !== false,
                req.user.id
            ]
        );

        // Fire-and-forget: send welcome email without blocking the response
        sendWelcomeEmail({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            password,  // plain-text password (only in memory, never stored)
            role
        }).catch(() => {}); // errors already logged inside sendWelcomeEmail

        res.status(201).json({
            success: true,
            message: `Account created for ${fullName}. Login credentials will be sent to ${email.toLowerCase()}.`,
            data: {
                id: result.insertId,
                full_name: fullName.trim(),
                email: email.toLowerCase(),
                role,
                status: 'approved',
                is_active: isActive !== false
            }
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating account'
        });
    }
});

// GET /api/auth/users — List all users (with optional role/search filter)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const { role, search } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (role && role !== 'all') {
            whereClause += ' AND u.role = ?';
            params.push(role);
        }

        if (search) {
            whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term);
        }

        const [users] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone_number,
                    u.status, u.is_active, u.created_at, u.updated_at,
                    d.name as department_name, f.name as faculty_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.id
             LEFT JOIN faculties f ON u.faculty_id = f.id
             ${whereClause}
             ORDER BY u.created_at DESC`,
            params
        );

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// PUT /api/auth/users/:id — Update a user
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role, phone_number, department_id, is_active } = req.body;

        const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't let admin delete themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot modify your own account from here' });
        }

        const updates = [];
        const values = [];

        if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email.toLowerCase()); }
        if (role !== undefined) { updates.push('role = ?'); values.push(role); }
        if (phone_number !== undefined) { updates.push('phone_number = ?'); values.push(phone_number); }
        if (department_id !== undefined) { updates.push('department_id = ?'); values.push(department_id); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        res.status(200).json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
});

// DELETE /api/auth/users/:id — Delete a user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't let admin delete themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: `${users[0].full_name} has been deleted`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// PATCH /api/auth/users/:id/status — Toggle active/inactive
router.patch('/users/:id/status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query('SELECT id, full_name, is_active FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't let admin deactivate themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot toggle your own account status' });
        }

        const newStatus = !users[0].is_active;
        await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

        res.status(200).json({
            success: true,
            message: `${users[0].full_name} is now ${newStatus ? 'active' : 'inactive'}`,
            data: { id: parseInt(id), is_active: newStatus }
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ success: false, message: 'Error toggling user status' });
    }
});

export default router;
