// ============================================
// File: backend/routes/dashboardRoutes.js
// Dashboard Analytics Routes (Admin Graphs)
// Department-scoped for deptadmin
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken, isAdmin);

// Helper: get the dept filter for current user
function getDeptId(req) {
    return req.user.role === 'deptadmin' ? req.user.department_id : null;
}

// GET overview stats (cards at the top of dashboard)
router.get('/stats', async (req, res) => {
    try {
        const deptId = getDeptId(req);

        let studentQ, batchQ, courseQ, facultyQ, pendingQ;

        if (deptId) {
            [[{ count: studentQ }]] = await pool.query(
                'SELECT COUNT(*) as count FROM students s JOIN batches b ON s.batch_id = b.id WHERE s.is_active = true AND b.department_id = ?', [deptId]);
            [[{ count: batchQ }]] = await pool.query(
                "SELECT COUNT(*) as count FROM batches WHERE status = 'active' AND department_id = ?", [deptId]);
            [[{ count: courseQ }]] = await pool.query(
                'SELECT COUNT(*) as count FROM courses WHERE department_id = ?', [deptId]);
            [[{ count: facultyQ }]] = await pool.query(
                "SELECT COUNT(*) as count FROM users WHERE role = 'faculty' AND department_id = ? AND status = 'approved'", [deptId]);
            [[{ count: pendingQ }]] = await pool.query(
                "SELECT COUNT(*) as count FROM users WHERE status = 'pending' AND department_id = ?", [deptId]);
        } else {
            [[{ count: studentQ }]] = await pool.query('SELECT COUNT(*) as count FROM students WHERE is_active = true');
            [[{ count: batchQ }]] = await pool.query("SELECT COUNT(*) as count FROM batches WHERE status = 'active'");
            [[{ count: courseQ }]] = await pool.query('SELECT COUNT(*) as count FROM courses');
            [[{ count: facultyQ }]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'faculty' AND status = 'approved'");
            [[{ count: pendingQ }]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
        }

        res.json({
            success: true,
            data: {
                total_students: studentQ,
                total_users: facultyQ,
                active_batches: batchQ,
                total_courses: courseQ,
                total_departments: 1,
                pending_approvals: pendingQ
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
        const deptId = getDeptId(req);
        let query = `SELECT d.name as department, COUNT(s.id) as student_count
             FROM departments d
             LEFT JOIN batches b ON b.department_id = d.id
             LEFT JOIN students s ON s.batch_id = b.id`;
        const params = [];
        if (deptId) { query += ' WHERE d.id = ?'; params.push(deptId); }
        query += ' GROUP BY d.id, d.name ORDER BY student_count DESC';

        const [data] = await pool.query(query, params);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Students per dept error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET enrollment trends (line chart — monthly)
router.get('/enrollment-trends', async (req, res) => {
    try {
        const deptId = getDeptId(req);
        let query = `SELECT DATE_FORMAT(e.created_at, '%Y-%m') as month,
                    COUNT(*) as enrollment_count
             FROM enrollments e`;
        const params = [];
        if (deptId) {
            query += ` JOIN course_assignments ca ON e.course_assignment_id = ca.id
                       JOIN semesters sem ON ca.semester_id = sem.id
                       JOIN batches b ON sem.batch_id = b.id
                       WHERE b.department_id = ?`;
            params.push(deptId);
        }
        query += ' GROUP BY month ORDER BY month ASC LIMIT 12';

        const [data] = await pool.query(query, params);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Enrollment trends error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// GET attendance rate (pie chart or line)
router.get('/attendance-overview', async (req, res) => {
    try {
        const deptId = getDeptId(req);
        let baseJoin = '';
        let whereClause = '';
        const params = [];
        if (deptId) {
            baseJoin = ` JOIN course_assignments ca ON attendance.course_assignment_id = ca.id
                         JOIN semesters sem ON ca.semester_id = sem.id
                         JOIN batches b ON sem.batch_id = b.id`;
            whereClause = ' WHERE b.department_id = ?';
            params.push(deptId);
        }

        const [data] = await pool.query(
            `SELECT attendance.status, COUNT(*) as count FROM attendance ${baseJoin} ${whereClause} GROUP BY attendance.status`, params
        );
        const [[total]] = await pool.query(
            `SELECT COUNT(*) as count FROM attendance ${baseJoin} ${whereClause}`, params
        );
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
        const deptId = getDeptId(req);
        let extraJoin = '';
        let whereExtra = '';
        const params = [];
        if (deptId) {
            extraJoin = ` JOIN course_assignments ca ON a.course_assignment_id = ca.id
                          JOIN semesters sem ON ca.semester_id = sem.id
                          JOIN batches b ON sem.batch_id = b.id`;
            whereExtra = ' AND b.department_id = ?';
            params.push(deptId);
        }

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
             ${extraJoin}
             WHERE g.score IS NOT NULL ${whereExtra}
             GROUP BY grade_letter
             ORDER BY grade_letter`, params
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
        const deptId = getDeptId(req);
        let whereExtra = '';
        const params = [];
        if (deptId) {
            whereExtra = ' AND u.department_id = ?';
            params.push(deptId);
        }

        const [data] = await pool.query(
            `SELECT u.full_name as faculty_name, COUNT(ca.id) as course_count
             FROM users u
             JOIN course_assignments ca ON ca.faculty_id = u.id
             WHERE u.role = 'faculty' ${whereExtra}
             GROUP BY u.id, u.full_name
             ORDER BY course_count DESC`, params
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
        const deptId = getDeptId(req);
        let whereClause = '';
        const params = [];
        if (deptId) { whereClause = 'WHERE b.department_id = ?'; params.push(deptId); }

        const [data] = await pool.query(
            `SELECT b.name as batch_name, b.status,
                    ROUND(AVG(s.cgpa), 2) as avg_cgpa,
                    COUNT(s.id) as student_count
             FROM batches b
             LEFT JOIN students s ON s.batch_id = b.id
             ${whereClause}
             GROUP BY b.id, b.name, b.status
             ORDER BY b.start_date DESC`, params
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
        const deptId = getDeptId(req);
        let whereClause = '';
        const params = [];
        if (deptId) { whereClause = 'WHERE d.id = ?'; params.push(deptId); }

        const [data] = await pool.query(
            `SELECT d.name as department, COUNT(c.id) as course_count
             FROM departments d
             LEFT JOIN courses c ON c.department_id = d.id
             ${whereClause}
             GROUP BY d.id, d.name
             ORDER BY course_count DESC`, params
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
        const deptId = getDeptId(req);
        let whereClause = '';
        const params = [];
        if (deptId) { whereClause = 'WHERE department_id = ?'; params.push(deptId); }

        const [data] = await pool.query(
            `SELECT role, COUNT(*) as count FROM users ${whereClause} GROUP BY role ORDER BY count DESC`, params
        );
        res.json({ success: true, data });
    } catch (error) {
        console.error('Users by role error:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

export default router;
