import express from 'express';
import { signup, login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { getFacultyNames, getDepartments, getAllDepartments } from '../data/faculties.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected route
router.get('/profile', verifyToken, getProfile);

// Get faculties list
router.get('/faculties', (req, res) => {
    res.status(200).json({
        success: true,
        data: getFacultyNames()
    });
});

// Get departments for a faculty
router.get('/departments/:faculty', (req, res) => {
    const departments = getDepartments(req.params.faculty);
    res.status(200).json({
        success: true,
        data: departments
    });
});

// Get all departments
router.get('/departments', (req, res) => {
    res.status(200).json({
        success: true,
        data: getAllDepartments()
    });
});

export default router;
