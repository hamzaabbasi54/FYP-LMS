import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Faculty from '../models/Faculty.js';

// Faculty Signup Controller
export const facultySignup = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Validate required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if faculty already exists
        const existingFaculty = await Faculty.findOne({ email });
        if (existingFaculty) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new faculty
        const faculty = new Faculty({
            fullName,
            email,
            password: hashedPassword,
            role: 'faculty'
        });

        await faculty.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: faculty._id,
                email: faculty.email,
                role: faculty.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Faculty registered successfully',
            token,
            data: {
                id: faculty._id,
                fullName: faculty.fullName,
                email: faculty.email,
                role: faculty.role
            }
        });
    } catch (error) {
        console.error('Faculty signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating faculty account'
        });
    }
};

// Faculty Login Controller
export const facultyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check faculty credentials
        const faculty = await Faculty.findOne({ email });

        if (!faculty) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare hashed password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, faculty.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: faculty._id,
                email: faculty.email,
                role: faculty.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Faculty login successful',
            token,
            data: {
                id: faculty._id,
                fullName: faculty.fullName,
                email: faculty.email,
                role: faculty.role
            }
        });
    } catch (error) {
        console.error('Faculty login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during faculty login'
        });
    }
};
