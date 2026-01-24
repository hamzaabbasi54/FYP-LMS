import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getFacultyByDepartment } from '../data/faculties.js';

// Super Admin hardcoded credentials
const SUPER_ADMIN_EMAIL = 'admin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'admin123';

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

        // Super admin cannot signup
        if (role === 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Super Admin account cannot be created through signup'
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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Determine faculty from department if not provided
        let userFaculty = faculty;
        if ((role === 'deptadmin' || role === 'faculty') && department && !faculty) {
            userFaculty = getFacultyByDepartment(department);
        }

        // Create new user with pending status
        const newUser = new User({
            fullName,
            email,
            password,
            role,
            faculty: userFaculty || '',
            department: department || '',
            phoneNumber: phoneNumber || '',
            status: 'pending'
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Signup successful! Your account is pending approval.',
            data: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
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

        // Super Admin login (hardcoded)
        if (role === 'superadmin') {
            if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Super Admin credentials'
                });
            }

            // Generate JWT for super admin
            const token = jwt.sign(
                {
                    id: 'superadmin',
                    email: SUPER_ADMIN_EMAIL,
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
                    id: 'superadmin',
                    fullName: 'Super Administrator',
                    email: SUPER_ADMIN_EMAIL,
                    role: 'superadmin'
                }
            });
        }

        // Regular user login
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if role matches
        if (user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `This account is registered as ${user.role}, not ${role}`
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
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
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                faculty: user.faculty,
                department: user.department
            },
            process.env.JWT_SECRET || 'KEY',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                faculty: user.faculty,
                department: user.department
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
        if (req.user.role === 'superadmin') {
            return res.status(200).json({
                success: true,
                data: {
                    id: 'superadmin',
                    fullName: 'Super Administrator',
                    email: SUPER_ADMIN_EMAIL,
                    role: 'superadmin'
                }
            });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
};
