import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Admin Login Controller
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check hardcoded admin credentials
        if (email !== 'admin@gmail.com' || password !== 'admin123') {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Find or create admin user
        let admin = await Admin.findOne({ email: 'admin@gmail.com' });

        if (!admin) {
            admin = new Admin({
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'admin',
                fullName: 'Administrator'
            });
            await admin.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET || 'KEY',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            data: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during admin login'
        });
    }
};
