// ============================================
// File: backend/routes/auth.js
// Auth Routes — MySQL Version
// ============================================

import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { signup, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import pool from '../config/db.js';
import { sendInviteEmail, sendPasswordResetEmail } from '../utils/email.js';
import { cacheDel, cacheDelPattern } from '../config/redis.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected route
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

// GET /api/auth/me — Restore auth state on page refresh (reads cookie)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status, u.is_active,
                    u.faculty_id, u.department_id,
                    f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                faculty: user.faculty_name || '',
                department: user.department_name || '',
                faculty_id: user.faculty_id,
                department_id: user.department_id
            }
        });
    } catch (error) {
        console.error('Get /me error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
});

// POST /api/auth/logout — Clear the HTTP-Only cookie
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.status(200).json({ success: true, message: 'Logged out' });
});

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

// POST /api/auth/create-account — Admin creates a user and sends an invite email
router.post('/create-account', verifyToken, isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { fullName, email, role, department, faculty, phoneNumber, permissions, isActive, employment_type = 'permanent' } = req.body;

        // Validate required fields
        if (!fullName || !email || !role) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Full name, email, and role are required' });
        }

        // --- ROLE HIERARCHY ENFORCEMENT ---
        if (req.user.role === 'super_admin' && role !== 'deptadmin') {
            await conn.rollback();
            return res.status(403).json({ success: false, message: 'Super Admins can only create Department Admins.' });
        }
        if (req.user.role === 'deptadmin' && role !== 'faculty') {
            await conn.rollback();
            return res.status(403).json({ success: false, message: 'Department Admins can only create Faculty members.' });
        }

        // Resolve department_id
        let departmentId = null;
        let facultyId = null;

        // If deptadmin, force the target department to be their own department
        let targetDepartmentName = department;
        if (req.user.role === 'deptadmin') {
            // Find deptadmin's department
            const [deptadminRows] = await conn.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
            if (deptadminRows.length > 0 && deptadminRows[0].department_id) {
                departmentId = deptadminRows[0].department_id;
            } else {
                await conn.rollback();
                return res.status(400).json({ success: false, message: 'Your admin account is not linked to a department.' });
            }
        } else if (department) {
            const [deptRows] = await conn.query('SELECT id, faculty_id FROM departments WHERE name = ?', [department]);
            if (deptRows.length > 0) {
                departmentId = deptRows[0].id;
                facultyId = deptRows[0].faculty_id;
            }
        }

        if (!departmentId) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Valid department is required.' });
        }

        // Check if email already exists
        const [existing] = await conn.query('SELECT id, role, full_name FROM users WHERE email = ?', [email.toLowerCase()]);
        
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({
                success: false,
                message: 'This email is already registered. Visiting faculty must use a separate email for each department.'
            });
        }

        // --- CREATE NEW USER ---
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');
        const inviteExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const [result] = await conn.query(
            `INSERT INTO users (full_name, email, password, role, faculty_id, department_id, phone_number, status, is_active, approved_by, invite_token, invite_expires)
             VALUES (?, ?, '', ?, ?, ?, ?, 'approved', ?, ?, ?, ?)`,
            [
                fullName.trim(),
                email.toLowerCase(),
                role,
                facultyId,
                departmentId,
                phoneNumber || '',
                isActive !== false,
                req.user.id,
                hashedToken,
                inviteExpires
            ]
        );

        const newUserId = result.insertId;

        // Note: Visiting faculty use separate accounts per department.
        // users.department_id is the sole source of truth.

        await conn.commit();

        if (role === 'faculty' && departmentId) {
            await cacheDelPattern(`facultyUsers:${departmentId}`);
        }
        await cacheDelPattern('dashboard:stats:*');

        // Fire-and-forget email
        sendInviteEmail({
            fullName: fullName.trim(),
            email: email.toLowerCase(),
            role,
            inviteToken
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: `Account created for ${fullName}. An invite email will be sent to ${email.toLowerCase()}.`,
            data: { id: newUserId, full_name: fullName.trim(), email: email.toLowerCase(), role }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Create account error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error creating account' });
    } finally {
        conn.release();
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

        if (req.user.role === 'deptadmin') {
            // Dept admin can only see faculty members in their department
            const deptId = req.user.department_id;
            if (deptId) {
                whereClause += ' AND u.role = ?';
                params.push('faculty');
                whereClause += ' AND u.department_id = ?';
                params.push(deptId);
                whereClause += ' AND u.id != ?';
                params.push(req.user.id);
            }
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

        // Don't let admin modify themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot modify your own account from here' });
        }

        // CRIT-2: Department admin can only modify users in their own department
        if (req.user.role === 'deptadmin') {
            if (existing[0].department_id !== req.user.department_id) {
                return res.status(403).json({ success: false, message: 'Access denied. User belongs to a different department.' });
            }
        }

        // CRIT-3: Role hierarchy — deptadmins can only assign 'faculty' role
        if (role !== undefined) {
            const allowedRoles = req.user.role === 'super_admin'
                ? ['super_admin', 'deptadmin', 'faculty']
                : ['faculty'];
            if (!allowedRoles.includes(role)) {
                return res.status(403).json({ success: false, message: 'You do not have permission to assign this role.' });
            }
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

        // If is_active was set to false, bump token_version and invalidate session cache
        // (mirrors the behavior in PATCH /users/:id/status)
        if (is_active !== undefined && !is_active) {
            await pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [id]);
            await cacheDel(`session:user:${id}`);
        } else if (is_active !== undefined) {
            // Even on reactivation, clear stale cache
            await cacheDel(`session:user:${id}`);
        }

        if (existing[0].role === 'faculty' || role === 'faculty') {
            await cacheDelPattern(`facultyUsers:${existing[0].department_id}`);
            if (department_id) {
                await cacheDelPattern(`facultyUsers:${department_id}`);
            }
        }
        await cacheDelPattern('dashboard:stats:*');

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

        // Department scoping: deptadmin can only delete users in own department
        if (req.user.role === 'deptadmin' && users[0].department_id !== req.user.department_id) {
            return res.status(403).json({ success: false, message: 'Access denied. User belongs to a different department.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        if (users[0].role === 'faculty') {
            await cacheDelPattern(`facultyUsers:${users[0].department_id}`);
        }

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

        const [users] = await pool.query('SELECT id, full_name, is_active, role, department_id FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't let admin deactivate themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot toggle your own account status' });
        }

        // Department scoping: deptadmin can only toggle users in own department
        if (req.user.role === 'deptadmin' && users[0].department_id !== req.user.department_id) {
            return res.status(403).json({ success: false, message: 'Access denied. User belongs to a different department.' });
        }

        const newStatus = !users[0].is_active;
        // Bump token_version on deactivation to invalidate existing sessions
        if (!newStatus) {
            await pool.query('UPDATE users SET is_active = ?, token_version = token_version + 1 WHERE id = ?', [newStatus, id]);
        } else {
            await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
        }

        // Invalidate Redis session cache so auth middleware reads fresh data
        await cacheDel(`session:user:${id}`);

        if (users[0].role === 'faculty') {
            await cacheDelPattern(`facultyUsers:${users[0].department_id}`);
        }

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

// =====================================================
// PUBLIC: Set password via invite token
// =====================================================

// POST /api/auth/set-password — User sets their password using invite token
router.post('/set-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Hash the incoming token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with this token that hasn't expired
        const [users] = await pool.query(
            `SELECT id, full_name, email FROM users
             WHERE invite_token = ? AND invite_expires > NOW()`,
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invite link. Please contact your administrator.'
            });
        }

        const user = users[0];

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear the invite token
        await pool.query(
            `UPDATE users SET password = ?, invite_token = NULL, invite_expires = NULL WHERE id = ?`,
            [hashedPassword, user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Password set successfully! You can now log in.'
        });
    } catch (error) {
        console.error('Set password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting password'
        });
    }
});

// POST /api/auth/validate-invite — Check if an invite token is still valid
router.post('/validate-invite', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const [users] = await pool.query(
            `SELECT id, full_name, email FROM users
             WHERE invite_token = ? AND invite_expires > NOW()`,
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invite link'
            });
        }

        res.status(200).json({
            success: true,
            data: { fullName: users[0].full_name, email: users[0].email }
        });
    } catch (error) {
        console.error('Validate invite error:', error);
        res.status(500).json({ success: false, message: 'Error validating invite' });
    }
});

// =====================================================
// PUBLIC: Forgot Password / Reset Password
// =====================================================

// POST /api/auth/forgot-password — Request a password reset link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Always respond with success to prevent email enumeration
        const successMessage = 'If an account with that email exists, a reset link has been sent.';

        // Check if user exists
        const [users] = await pool.query(
            'SELECT id, full_name, email FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            // User doesn't exist, but we don't reveal that
            return res.status(200).json({ success: true, message: successMessage });
        }

        const user = users[0];

        // Generate reset token (1 hour expiry)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store hashed token in DB
        await pool.query(
            'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
            [hashedToken, resetExpires, user.id]
        );

        // Fire-and-forget: send reset email
        sendPasswordResetEmail({
            fullName: user.full_name,
            email: user.email,
            resetToken  // raw token for the URL
        }).catch(() => {});

        res.status(200).json({ success: true, message: successMessage });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset request'
        });
    }
});

// POST /api/auth/reset-password — Reset password using token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Hash the incoming token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const [users] = await pool.query(
            `SELECT id, full_name FROM users
             WHERE reset_token = ? AND reset_expires > NOW()`,
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link. Please request a new one.'
            });
        }

        const user = users[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password, clear reset token, and invalidate existing sessions
        await pool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL, token_version = token_version + 1 WHERE id = ?',
            [hashedPassword, user.id]
        );

        // Invalidate Redis session cache so token_version check is fresh
        await cacheDel(`session:user:${user.id}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully! You can now log in with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
});

export default router;
