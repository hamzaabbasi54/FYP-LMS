// ============================================
// File: backend/controllers/authController.js
// Auth Controller — MySQL Version (2-Role: deptadmin + faculty)
// ============================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { cacheDel } from '../config/redis.js';

// Signup Controller — Faculty only (admins are seeded in DB)
export const signup = async (req, res) => {
    try {
        const { fullName, email, password, department, phoneNumber } = req.body;

        // Validate required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, and password are required'
            });
        }

        // Validate name length
        if (fullName.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 3 characters'
            });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Department is required for faculty
        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department selection is required'
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Unable to create account with the provided details. Please try a different email.'
            });
        }

        // Resolve department_id and faculty_id from department name
        const [deptRows] = await pool.query(
            'SELECT id, faculty_id FROM departments WHERE name = ?',
            [department]
        );
        if (deptRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Department "${department}" not found`
            });
        }
        if (deptRows.length > 1) {
            return res.status(400).json({
                success: false,
                message: 'Multiple departments found with the same name. Please provide a unique department identifier.'
            });
        }
        const departmentId = deptRows[0].id;
        const facultyId = deptRows[0].faculty_id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user as faculty with pending status
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password, role, faculty_id, department_id, phone_number, status)
             VALUES (?, ?, ?, 'faculty', ?, ?, ?, 'pending')`,
            [
                fullName.trim(),
                email.toLowerCase(),
                hashedPassword,
                facultyId,
                departmentId,
                phoneNumber || ''
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Signup successful! Your account is pending approval by the Department Admin.',
            data: {
                id: result.insertId,
                fullName: fullName.trim(),
                email: email.toLowerCase(),
                role: 'faculty',
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error during signup'
        });
    }
};

// Login Controller — supports deptadmin and faculty
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Validate role
        const validRoles = ['super_admin', 'deptadmin', 'faculty'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be super_admin, deptadmin, or faculty'
            });
        }

        // Find user
        const [users] = await pool.query(
            `SELECT u.*, f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.email = ?`,
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check password first
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if role matches (if role was specified)
        if (role && user.role !== role) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if approved (faculty needs approval; admins are seeded as approved)
        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: user.status === 'pending'
                    ? 'Your account is pending approval'
                    : 'Your account has been rejected'
            });
        }

        // Check if active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Generate JWT (includes token_version for invalidation support)
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                faculty: user.faculty_name || '',
                department: user.department_name || '',
                faculty_id: user.faculty_id,
                department_id: user.department_id,
                token_version: user.token_version || 0
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set HTTP-Only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
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
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status, u.is_active,
                    u.created_at, u.updated_at,
                    f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
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
                phoneNumber: user.phone_number,
                status: user.status,
                isActive: user.is_active,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullName } = req.body;
        if (!fullName || fullName.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 3 characters'
            });
        }

        await pool.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName.trim(), req.user.id]);

        // Get updated profile
        const [users] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status, u.is_active,
                    u.created_at, u.updated_at,
                    f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [req.user.id]
        );

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
                department_id: user.department_id,
                phoneNumber: user.phone_number,
                status: user.status,
                isActive: user.is_active
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current and new passwords are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        // Invalidate Redis session cache so token_version is re-verified
        await cacheDel(`session:user:${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
};
