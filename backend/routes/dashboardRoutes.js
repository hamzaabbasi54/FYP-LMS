// ============================================
// File: backend/routes/dashboardRoutes.js
// Dashboard Analytics Routes (Admin Graphs)
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken, isAdmin);

// GET overview stats (cards at the top of dashboard)
router.get('/stats', async (req, res) => {
    try {
        const [[students]] = await pool.query('SELECT COUNT(*) as count FROM students WHERE is_active = true');
        const [[users]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = ?', ['approved']);
        const [[batches]] = await pool.query("SELECT COUNT(*) as count FROM batches WHERE status = 'active'");
        const [[courses]] = await pool.query('SELECT COUNT(*) as count FROM courses');
        const [[departments]] = await pool.query('SELECT COUNT(*) as count FROM departments');
        const [[pending]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");

        res.json({
            success: true,
            data: {
                total_students: students.count,
                total_users: users.count,
                active_batches: batches.count,
                total_courses: courses.count,
                total_departments: departments.count,
                pending_approvals: pending.count
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
});

// GET students per department (bar chart)
router.get('/students-per-department', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT d.name as department, COUNT(s.id) as student_count
             FROM departments d
             LEFT JOIN batches b ON b.department_id = d.id
             LEFT JOIN students s ON s.batch_id = b.id
             GROUP BY d.id, d.name
             ORDER BY student_count DESC`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Students per dept error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET enrollment trends (line chart — monthly)
router.get('/enrollment-trends', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT DATE_FORMAT(enrolled_at, '%Y-%m') as month,
                    COUNT(*) as enrollment_count
             FROM enrollments
             GROUP BY month
             ORDER BY month ASC
             LIMIT 12`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Enrollment trends error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET attendance rate (pie chart or line)
router.get('/attendance-overview', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT status, COUNT(*) as count
             FROM attendance
             GROUP BY status`
        );
        const [[total]] = await pool.query('SELECT COUNT(*) as count FROM attendance');
        res.json({
            success: true,
            data: { breakdown: data, total: total.count }
        });
    } catch (error) {
        console.error('Attendance overview error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET grade distribution (histogram)
router.get('/grade-distribution', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT
                CASE
                    WHEN (score / a.max_score * 100) >= 90 THEN 'A'
                    WHEN (score / a.max_score * 100) >= 80 THEN 'B'
                    WHEN (score / a.max_score * 100) >= 70 THEN 'C'
                    WHEN (score / a.max_score * 100) >= 60 THEN 'D'
                    ELSE 'F'
                END as grade_letter,
                COUNT(*) as count
             FROM grades g
             JOIN assessments a ON g.assessment_id = a.id
             WHERE g.score IS NOT NULL
             GROUP BY grade_letter
             ORDER BY grade_letter`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Grade distribution error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET faculty workload (courses per teacher)
router.get('/faculty-workload', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT u.full_name as faculty_name, COUNT(ca.id) as course_count
             FROM users u
             JOIN course_assignments ca ON ca.faculty_id = u.id
             WHERE u.role = 'faculty'
             GROUP BY u.id, u.full_name
             ORDER BY course_count DESC`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Faculty workload error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET batch CGPA averages
router.get('/batch-cgpa', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT b.name as batch_name, b.status,
                    ROUND(AVG(s.cgpa), 2) as avg_cgpa,
                    COUNT(s.id) as student_count
             FROM batches b
             LEFT JOIN students s ON s.batch_id = b.id
             GROUP BY b.id, b.name, b.status
             ORDER BY b.start_date DESC`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Batch CGPA error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET courses per department
router.get('/courses-per-department', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT d.name as department, COUNT(c.id) as course_count
             FROM departments d
             LEFT JOIN courses c ON c.department_id = d.id
             GROUP BY d.id, d.name
             ORDER BY course_count DESC`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Courses per dept error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET users by role (for pie chart)
router.get('/users-by-role', async (req, res) => {
    try {
        const [data] = await pool.query(
            `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Users by role error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

export default router;
