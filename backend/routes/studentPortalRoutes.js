// ============================================
// Student Portal Routes — read-only mobile data
// All queries scoped to req.student.student_id
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyStudentToken } from '../middleware/studentAuth.js';
import {
    assertStudentEnrolled,
    fetchStudentProfile,
    letterGradeFromPercentage,
} from '../utils/studentAccount.js';

const router = express.Router();
router.use(verifyStudentToken);

function assignmentStatus(dueDate, score) {
    if (score != null) return 'graded';
    if (dueDate && new Date(dueDate) < new Date()) return 'overdue';
    return 'pending';
}

// GET /api/student-portal/profile
router.get('/profile', async (req, res) => {
    try {
        const profile = await fetchStudentProfile(req.student.student_id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        console.error('Student profile error:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// GET /api/student-portal/courses
router.get('/courses', async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const [rows] = await pool.query(
            `SELECT ca.id AS course_assignment_id,
                    c.code AS course_code,
                    c.title AS course_title,
                    c.credit_hours,
                    sem.name AS semester,
                    u.full_name AS instructor,
                    (SELECT COUNT(*) FROM attendance att
                     WHERE att.course_assignment_id = ca.id AND att.student_id = ?) AS total_classes,
                    (SELECT COUNT(*) FROM attendance att
                     WHERE att.course_assignment_id = ca.id AND att.student_id = ?
                       AND att.status IN ('present', 'late')) AS present_classes,
                    (SELECT ROUND(AVG(g.score / NULLIF(a.max_score, 0)) * 100, 1)
                     FROM grades g
                     JOIN assessments a ON a.id = g.assessment_id
                     WHERE g.student_id = ? AND a.course_assignment_id = ca.id) AS avg_pct
             FROM enrollments e
             JOIN course_assignments ca ON ca.id = e.course_assignment_id
             JOIN courses c ON c.id = ca.course_id
             JOIN semesters sem ON sem.id = ca.semester_id
             LEFT JOIN users u ON u.id = ca.faculty_id
             WHERE e.student_id = ?
             ORDER BY c.code`,
            [studentId, studentId, studentId, studentId]
        );

        const data = rows.map((row) => {
            const total = Number(row.total_classes) || 0;
            const present = Number(row.present_classes) || 0;
            const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
            return {
                course_assignment_id: row.course_assignment_id,
                course_code: row.course_code,
                course_title: row.course_title,
                credit_hours: row.credit_hours,
                semester: row.semester,
                instructor: row.instructor || 'TBA',
                attendance_summary: {
                    total_classes: total,
                    present,
                    percentage: pct,
                },
                current_grade: letterGradeFromPercentage(row.avg_pct),
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Student courses error:', error);
        res.status(500).json({ success: false, message: 'Error fetching courses' });
    }
});

// GET /api/student-portal/schedule
router.get('/schedule', async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const [rows] = await pool.query(
            `SELECT DISTINCT cs.id, c.id AS course_id, c.code AS course_code, c.title AS course_name,
                    cs.day_of_week, cs.start_time, cs.end_time, cs.shift,
                    u.full_name AS instructor
             FROM students s
             JOIN enrollments e ON e.student_id = s.id
             JOIN course_assignments ca ON ca.id = e.course_assignment_id
             JOIN class_schedules cs ON cs.batch_id = s.batch_id AND cs.course_id = ca.course_id
             JOIN courses c ON c.id = cs.course_id
             LEFT JOIN users u ON u.id = cs.faculty_id
             WHERE s.id = ?
             ORDER BY FIELD(cs.day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
                      cs.start_time`,
            [studentId]
        );

        const data = rows.map((row) => ({
            id: row.id,
            course_id: String(row.course_id),
            course_code: row.course_code,
            course_name: row.course_name,
            day_of_week: row.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            instructor: row.instructor || 'TBA',
            room: row.shift ? String(row.shift).charAt(0).toUpperCase() + String(row.shift).slice(1) : '',
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Student schedule error:', error);
        res.status(500).json({ success: false, message: 'Error fetching schedule' });
    }
});

// GET /api/student-portal/courses/:id/attendance
router.get('/courses/:id/attendance', async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const courseAssignmentId = req.params.id;

        if (!(await assertStudentEnrolled(studentId, courseAssignmentId))) {
            return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
        }

        const [rows] = await pool.query(
            `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, status, remarks
             FROM attendance
             WHERE student_id = ? AND course_assignment_id = ?
             ORDER BY date DESC`,
            [studentId, courseAssignmentId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Student attendance error:', error);
        res.status(500).json({ success: false, message: 'Error fetching attendance' });
    }
});

// GET /api/student-portal/courses/:id/grades
router.get('/courses/:id/grades', async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const courseAssignmentId = req.params.id;

        if (!(await assertStudentEnrolled(studentId, courseAssignmentId))) {
            return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
        }

        const [rows] = await pool.query(
            `SELECT a.title, a.type, g.score, a.max_score,
                    DATE_FORMAT(COALESCE(g.graded_at, a.due_date), '%Y-%m-%d') AS date,
                    g.remarks AS feedback
             FROM assessments a
             INNER JOIN grades g ON g.assessment_id = a.id AND g.student_id = ?
             WHERE a.course_assignment_id = ?
               AND a.status IN ('published', 'needs_grading', 'graded')
             ORDER BY a.due_date DESC`,
            [studentId, courseAssignmentId]
        );

        const data = rows.map((row) => ({
            title: row.title,
            type: row.type,
            score: row.score,
            max_score: row.max_score,
            date: row.date,
            feedback: row.feedback,
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Student course grades error:', error);
        res.status(500).json({ success: false, message: 'Error fetching grades' });
    }
});

// GET /api/student-portal/grades — all subjects (quiz, mid, assignment marks from teacher)
router.get('/grades', async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const [rows] = await pool.query(
            `SELECT ca.id AS course_assignment_id, c.code AS course_code, c.title AS course_title,
                    a.id AS assessment_id, a.title, a.type, g.score, a.max_score,
                    DATE_FORMAT(COALESCE(g.graded_at, a.due_date), '%Y-%m-%d') AS date,
                    g.remarks AS feedback
             FROM enrollments e
             JOIN course_assignments ca ON ca.id = e.course_assignment_id
             JOIN courses c ON c.id = ca.course_id
             JOIN assessments a ON a.course_assignment_id = ca.id
             INNER JOIN grades g ON g.assessment_id = a.id AND g.student_id = e.student_id
             WHERE e.student_id = ?
               AND a.status IN ('published', 'needs_grading', 'graded')
             ORDER BY c.code ASC, a.due_date DESC`,
            [studentId]
        );

        const data = rows.map((row) => ({
            course_assignment_id: String(row.course_assignment_id),
            course_code: row.course_code,
            course_title: row.course_title,
            assessment_id: String(row.assessment_id),
            title: row.title,
            type: row.type,
            score: row.score,
            max_score: row.max_score,
            date: row.date,
            feedback: row.feedback,
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Student all-grades error:', error);
        res.status(500).json({ success: false, message: 'Error fetching grades' });
    }
});

// GET /api/student-portal/assignments
router.get('/assignments', async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const [rows] = await pool.query(
            `SELECT a.id, ca.id AS course_assignment_id, c.code AS course_code, c.title AS course_name,
                    a.title, a.description, a.due_date, a.max_score,
                    u.full_name AS instructor,
                    g.score AS obtained_marks, g.remarks AS feedback
             FROM assessments a
             JOIN course_assignments ca ON ca.id = a.course_assignment_id
             JOIN courses c ON c.id = ca.course_id
             JOIN enrollments e ON e.course_assignment_id = ca.id AND e.student_id = ?
             LEFT JOIN users u ON u.id = ca.faculty_id
             LEFT JOIN grades g ON g.assessment_id = a.id AND g.student_id = ?
             WHERE a.type = 'assignment'
               AND a.status IN ('published', 'needs_grading', 'graded')
             ORDER BY a.due_date DESC`,
            [studentId, studentId]
        );

        const data = rows.map((row) => ({
            id: String(row.id),
            course_id: String(row.course_assignment_id),
            course_code: row.course_code,
            course_name: row.course_name,
            title: row.title,
            description: row.description || '',
            instructor: row.instructor || 'TBA',
            due_date: row.due_date,
            max_marks: row.max_score,
            obtained_marks: row.obtained_marks,
            feedback: row.feedback,
            status: assignmentStatus(row.due_date, row.obtained_marks),
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Student assignments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assignments' });
    }
});

// GET /api/student-portal/assignments/:id
router.get('/assignments/:id', async (req, res) => {
    try {
        const studentId = req.student.student_id;
        const assessmentId = req.params.id;

        const [[row]] = await pool.query(
            `SELECT a.id, ca.id AS course_assignment_id, c.code AS course_code, c.title AS course_name,
                    a.title, a.description, a.due_date, a.max_score,
                    u.full_name AS instructor,
                    g.score AS obtained_marks, g.remarks AS feedback
             FROM assessments a
             JOIN course_assignments ca ON ca.id = a.course_assignment_id
             JOIN courses c ON c.id = ca.course_id
             JOIN enrollments e ON e.course_assignment_id = ca.id AND e.student_id = ?
             LEFT JOIN users u ON u.id = ca.faculty_id
             LEFT JOIN grades g ON g.assessment_id = a.id AND g.student_id = ?
             WHERE a.id = ? AND a.type = 'assignment'`,
            [studentId, studentId, assessmentId]
        );

        if (!row) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        res.json({
            success: true,
            data: {
                id: String(row.id),
                course_id: String(row.course_assignment_id),
                course_code: row.course_code,
                course_name: row.course_name,
                title: row.title,
                description: row.description || '',
                instructor: row.instructor || 'TBA',
                due_date: row.due_date,
                max_marks: row.max_score,
                obtained_marks: row.obtained_marks,
                feedback: row.feedback,
                status: assignmentStatus(row.due_date, row.obtained_marks),
            },
        });
    } catch (error) {
        console.error('Student assignment detail error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assignment' });
    }
});

// GET /api/student-portal/announcements
router.get('/announcements', async (req, res) => {
    try {
        const studentId = req.student.student_id;

        const [rows] = await pool.query(
            `SELECT a.id, a.title, a.description AS message, a.due_date AS posted_at,
                    c.code AS course_code, u.full_name AS teacher_name,
                    (a.type IN ('midterm', 'final')) AS is_important
             FROM assessments a
             JOIN course_assignments ca ON ca.id = a.course_assignment_id
             JOIN courses c ON c.id = ca.course_id
             JOIN enrollments e ON e.course_assignment_id = ca.id AND e.student_id = ?
             LEFT JOIN users u ON u.id = ca.faculty_id
             WHERE a.status IN ('published', 'scheduled', 'needs_grading', 'graded')
               AND a.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
             ORDER BY a.created_at DESC
             LIMIT 30`,
            [studentId]
        );

        const data = rows.map((row) => ({
            id: String(row.id),
            title: row.title,
            message: row.message || '',
            teacher_name: row.teacher_name || 'Faculty',
            course_code: row.course_code,
            posted_at: row.posted_at || new Date().toISOString(),
            is_important: Boolean(row.is_important),
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Student announcements error:', error);
        res.status(500).json({ success: false, message: 'Error fetching announcements' });
    }
});

export default router;
