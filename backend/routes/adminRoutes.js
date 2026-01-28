import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Example: Get all batches (Admin only)
router.get('/batches', verifyToken, isAdmin, (req, res) => {
    // This route is protected - only authenticated admins can access
    res.json({
        success: true,
        message: 'Admin batches data',
        user: req.user // User info from JWT token
    });
});

// Example: Get all faculty (Admin only)
router.get('/faculty', verifyToken, isAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Admin faculty data',
        user: req.user
    });
});

// Example: Get all courses (Admin only)
router.get('/courses', verifyToken, isAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Admin courses data',
        user: req.user
    });
});

export default router;
