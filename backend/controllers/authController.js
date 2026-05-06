// ============================================
// File: backend/controllers/authController.js
// Auth Controller — MySQL Version
// ============================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

// Signup Controller
export const signup = async (req, res) => {
    try {
        const { fullName, email, password, role, faculty, department, phoneNumber } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, password, and role are required'
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

        // Super admin cannot signup
        if (role === 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Super Admin account cannot be created through signup'
            });
        }

        // Validate role
        const validRoles = ['dean', 'deptadmin', 'faculty'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be dean, deptadmin, or faculty'
            });
        }

        // Validate role-specific requirements
        if (role === 'dean' && !faculty) {
            return res.status(400).json({
                success: false,
                message: 'Faculty selection is required for Dean role'
            });
        }

        if ((role === 'deptadmin' || role === 'faculty') && !department) {
            return res.status(400).json({
                success: false,
                message: 'Department selection is required for this role'
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
                message: 'Email already registered'
            });
        }

        // Resolve faculty_id and department_id from names
        let facultyId = null;
        let departmentId = null;

        if (role === 'dean' && faculty) {
            const [facRows] = await pool.query(
                'SELECT id FROM faculties WHERE name = ?',
                [faculty]
            );
            if (facRows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Faculty "${faculty}" not found`
                });
            }
            facultyId = facRows[0].id;
        }

        if ((role === 'deptadmin' || role === 'faculty') && department) {
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
            departmentId = deptRows[0].id;
            facultyId = deptRows[0].faculty_id; // auto-derive faculty from department
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, password, role, faculty_id, department_id, phone_number, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                fullName.trim(),
                email.toLowerCase(),
                hashedPassword,
                role,
                facultyId,
                departmentId,
                phoneNumber || ''
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Signup successful! Your account is pending approval.',
            data: {
                id: result.insertId,
                fullName: fullName.trim(),
                email: email.toLowerCase(),
                role,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error during signup'
        });
    }
};

// Login Controller
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

        // Super Admin login — check DB (user with role 'superadmin')
        if (role === 'superadmin') {
            const [admins] = await pool.query(
                'SELECT * FROM users WHERE role = ? AND email = ?',
                ['superadmin', email.toLowerCase()]
            );

            if (admins.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Super Admin credentials'
                });
            }

            const admin = admins[0];
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Super Admin credentials'
                });
            }

            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    role: 'superadmin'
                },
                process.env.JWT_SECRET || 'KEY',
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                message: 'Super Admin login successful',
                token,
                data: {
                    id: admin.id,
                    fullName: admin.full_name,
                    email: admin.email,
                    role: 'superadmin'
                }
            });
        }

        // Regular user login
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

        // Check if role matches
        if (user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `This account is registered as ${user.role}, not ${role}`
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if approved
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

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                faculty: user.faculty_name || '',
                department: user.department_name || '',
                faculty_id: user.faculty_id,
                department_id: user.department_id
            },
            process.env.JWT_SECRET || 'KEY',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                faculty: user.faculty_name || '',
                department: user.department_name || ''
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
