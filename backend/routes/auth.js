// ============================================
// File: backend/routes/auth.js
// Auth Routes — MySQL Version
// ============================================

import express from 'express';
import { signup, login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected route
router.get('/profile', verifyToken, getProfile);

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

export default router;
