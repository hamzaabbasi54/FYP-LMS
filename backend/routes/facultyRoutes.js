import express from 'express';
import { verifyToken, isFaculty } from '../middleware/auth.js';

const router = express.Router();

// Example: Get faculty courses (Faculty only)
router.get('/courses', verifyToken, isFaculty, (req, res) => {
    // This route is protected - only authenticated faculty can access
    res.json({
        success: true,
        message: 'Faculty courses data',
        user: req.user // User info from JWT token
    });
});

// Example: Get faculty attendance (Faculty only)
router.get('/attendance', verifyToken, isFaculty, (req, res) => {
    res.json({
        success: true,
        message: 'Faculty attendance data',
        user: req.user
    });
});

// Example: Submit grades (Faculty only)
router.post('/grades', verifyToken, isFaculty, (req, res) => {
    res.json({
        success: true,
        message: 'Grades submitted successfully',
        user: req.user
    });
});

export default router;
