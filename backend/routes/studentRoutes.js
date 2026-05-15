// ============================================
// File: backend/routes/studentRoutes.js
// Students, Parents, Enrollments CRUD Routes
// With Pagination + Excel Import/Export
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAdmin, isAuthenticated } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir } from '../utils/excel.js';

const router = express.Router();
router.use(verifyToken);

// Multer config for Excel uploads
const upload = multer({ dest: getUploadDir() });

// ===================== STUDENTS =====================

// GET all students (paginated, filterable by batch)
router.get('/', async (req, res) => {
    try {
        const { batch_id, search } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        let whereClause = 'WHERE 1=1';
        const params = [];
        if (batch_id) { whereClause += ' AND s.batch_id = ?'; params.push(batch_id); }
        if (search) {
            whereClause += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id_number LIKE ? OR s.email LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        // Count total
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM students s ${whereClause}`, params
        );

        // Get paginated data
        const [students] = await pool.query(
            `SELECT s.*, b.name as batch_name, d.name as department_name
             FROM students s
             JOIN batches b ON s.batch_id = b.id
             JOIN departments d ON b.department_id = d.id
             ${whereClause}
             ORDER BY s.student_id_number
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json(paginatedResponse(students, total, page, limit));
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Error fetching students' });
    }
});

// GET single student with parent and enrollments
router.get('/:id', async (req, res) => {
    try {
        const [students] = await pool.query(
            `SELECT s.*, b.name as batch_name, d.name as department_name
             FROM students s
             JOIN batches b ON s.batch_id = b.id
             JOIN departments d ON b.department_id = d.id
             WHERE s.id = ?`,
            [req.params.id]
        );
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const [parent] = await pool.query('SELECT * FROM parents WHERE student_id = ?', [req.params.id]);
        const [enrollments] = await pool.query(
            `SELECT e.*, c.title as course_title, c.code as course_code,
                    sem.name as semester_name, u.full_name as instructor_name
             FROM enrollments e
             JOIN course_assignments ca ON e.course_assignment_id = ca.id
             JOIN courses c ON ca.course_id = c.id
             JOIN semesters sem ON ca.semester_id = sem.id
             LEFT JOIN users u ON ca.faculty_id = u.id
             WHERE e.student_id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: { ...students[0], parent: parent.length > 0 ? parent[0] : null, enrollments }
        });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ success: false, message: 'Error fetching student' });
    }
});

// POST create student (with optional parent)
router.post('/', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { first_name, last_name, email, phone, batch_id, parent, matric_marks, fsc_marks, background } = req.body;

        if (!first_name || !last_name || !email || !batch_id) {
            return res.status(400).json({ success: false, message: 'first_name, last_name, email, batch_id are required' });
        }

        // Auto-generate student ID
        const year = new Date().getFullYear();
        const [countResult] = await conn.query(
            "SELECT COUNT(*) as count FROM students WHERE student_id_number LIKE ?", [`U${year}%`]
        );
        const nextNum = (countResult[0].count + 1).toString().padStart(3, '0');
        const studentIdNumber = `U${year}${nextNum}`;

        const [result] = await conn.query(
            `INSERT INTO students (student_id_number, first_name, last_name, email, phone, batch_id, matric_marks, fsc_marks, background)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [studentIdNumber, first_name, last_name, email.toLowerCase(), phone || '', batch_id, matric_marks || null, fsc_marks || null, background || null]
        );
        const studentId = result.insertId;

        if (parent && parent.name) {
            await conn.query(
                'INSERT INTO parents (student_id, name, email, phone) VALUES (?, ?, ?, ?)',
                [studentId, parent.name, parent.email || null, parent.phone || null]
            );
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: 'Student registered',
            data: { id: studentId, student_id_number: studentIdNumber, first_name, last_name }
        });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        console.error('Create student error:', error);
        res.status(500).json({ success: false, message: 'Error registering student' });
    } finally {
        conn.release();
    }
});

// PUT update student
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { first_name, last_name, email, phone, batch_id, cgpa, is_active, matric_marks, fsc_marks, background } = req.body;
        const fields = [];
        const values = [];
        if (first_name) { fields.push('first_name = ?'); values.push(first_name); }
        if (last_name) { fields.push('last_name = ?'); values.push(last_name); }
        if (email) { fields.push('email = ?'); values.push(email.toLowerCase()); }
        if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
        if (batch_id) { fields.push('batch_id = ?'); values.push(batch_id); }
        if (cgpa !== undefined) { fields.push('cgpa = ?'); values.push(cgpa); }
        if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
        if (matric_marks !== undefined) { fields.push('matric_marks = ?'); values.push(matric_marks); }
        if (fsc_marks !== undefined) { fields.push('fsc_marks = ?'); values.push(fsc_marks); }
        if (background !== undefined) { fields.push('background = ?'); values.push(background); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        values.push(req.params.id);
        const [result] = await pool.query(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student updated' });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: 'Error updating student' });
    }
});

// DELETE student
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, message: 'Student deleted' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ success: false, message: 'Error deleting student' });
    }
});

// ===================== EXCEL IMPORT =====================

// POST bulk import students from Excel
router.post('/import', isAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Excel file is required. Upload as form-data with key "file".' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        // Validate required columns
        const requiredCols = ['first_name', 'last_name', 'email'];
        const missingCols = requiredCols.filter(col => !(col in rows[0]));
        if (missingCols.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required columns: ${missingCols.join(', ')}`,
                expected_columns: ['first_name', 'last_name', 'email', 'phone', 'parent_name', 'parent_email', 'parent_phone', 'matric_marks', 'fsc_marks', 'background']
            });
        }

        const targetBatchId = req.body.batch_id;
        if (!targetBatchId && !rows[0].batch_id) {
            return res.status(400).json({ success: false, message: 'Batch ID is required either in the URL/body or the CSV' });
        }

        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Auto-generate student ID
                const year = new Date().getFullYear();
                const [countResult] = await conn.query(
                    "SELECT COUNT(*) as count FROM students WHERE student_id_number LIKE ?", [`U${year}%`]
                );
                const nextNum = (countResult[0].count + 1).toString().padStart(3, '0');
                const studentIdNumber = `U${year}${nextNum}`;

                const studentBatchId = row.batch_id || targetBatchId;

                const [result] = await conn.query(
                    `INSERT INTO students (student_id_number, first_name, last_name, email, phone, batch_id, matric_marks, fsc_marks, background)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [studentIdNumber, row.first_name, row.last_name, String(row.email).toLowerCase(), row.phone || '', studentBatchId, row.matric_marks || null, row.fsc_marks || null, row.background || null]
                );

                // Insert parent if provided
                if (row.parent_name) {
                    await conn.query(
                        'INSERT INTO parents (student_id, name, email, phone) VALUES (?, ?, ?, ?)',
                        [result.insertId, row.parent_name, row.parent_email || null, row.parent_phone || null]
                    );
                }

                imported++;
            } catch (err) {
                skipped++;
                errors.push({ row: i + 2, email: row.email, error: err.code === 'ER_DUP_ENTRY' ? 'Duplicate email' : err.message });
            }
        }

        await conn.commit();
        res.json({
            success: true,
            message: `Import complete: ${imported} added, ${skipped} skipped`,
            data: { imported, skipped, errors: errors.slice(0, 20) }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Import students error:', error);
        res.status(500).json({ success: false, message: 'Error importing students' });
    } finally {
        conn.release();
    }
});

// ===================== EXCEL EXPORT =====================

// GET export all students as Excel
router.get('/export/excel', isAdmin, async (req, res) => {
    try {
        const { batch_id } = req.query;
        let query = `SELECT s.student_id_number, s.first_name, s.last_name, s.email, s.phone,
                            s.cgpa, s.is_active, s.matric_marks, s.fsc_marks, s.background,
                            b.name as batch_name, d.name as department_name,
                            p.name as parent_name, p.email as parent_email, p.phone as parent_phone,
                            s.created_at
                     FROM students s
                     JOIN batches b ON s.batch_id = b.id
                     JOIN departments d ON b.department_id = d.id
                     LEFT JOIN parents p ON p.student_id = s.id`;
        const params = [];
        if (batch_id) { query += ' WHERE s.batch_id = ?'; params.push(batch_id); }
        query += ' ORDER BY s.student_id_number';

        const [students] = await pool.query(query, params);

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found to export' });
        }

        const buffer = generateExcel(students, 'Students');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export students error:', error);
        res.status(500).json({ success: false, message: 'Error exporting students' });
    }
});

// ===================== PARENTS =====================

router.get('/:studentId/parent', async (req, res) => {
    try {
        const [parents] = await pool.query('SELECT * FROM parents WHERE student_id = ?', [req.params.studentId]);
        res.json({ success: true, data: parents.length > 0 ? parents[0] : null });
    } catch (error) {
        console.error('Get parent error:', error);
        res.status(500).json({ success: false, message: 'Error fetching parent' });
    }
});

router.put('/:studentId/parent', isAdmin, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Parent name is required' });
        }
        await pool.query(
            `INSERT INTO parents (student_id, name, email, phone) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone)`,
            [req.params.studentId, name, email || null, phone || null]
        );
        res.json({ success: true, message: 'Parent info saved' });
    } catch (error) {
        console.error('Save parent error:', error);
        res.status(500).json({ success: false, message: 'Error saving parent' });
    }
});

// ===================== ENROLLMENTS =====================

router.post('/enroll', isAdmin, async (req, res) => {
    try {
        const { student_id, course_assignment_id } = req.body;
        if (!student_id || !course_assignment_id) {
            return res.status(400).json({ success: false, message: 'student_id and course_assignment_id are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO enrollments (student_id, course_assignment_id) VALUES (?, ?)',
            [student_id, course_assignment_id]
        );
        res.status(201).json({ success: true, message: 'Student enrolled', data: { id: result.insertId } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Student already enrolled in this course' });
        }
        console.error('Enroll student error:', error);
        res.status(500).json({ success: false, message: 'Error enrolling student' });
    }
});

router.delete('/enroll/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }
        res.json({ success: true, message: 'Student unenrolled' });
    } catch (error) {
        console.error('Unenroll student error:', error);
        res.status(500).json({ success: false, message: 'Error unenrolling student' });
    }
});

router.get('/enrolled/:courseAssignmentId', async (req, res) => {
    try {
        const { page: pg, limit: lm } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM enrollments WHERE course_assignment_id = ?',
            [req.params.courseAssignmentId]
        );

        const [students] = await pool.query(
            `SELECT s.*, e.id as enrollment_id, e.enrolled_at
             FROM students s
             JOIN enrollments e ON s.id = e.student_id
             WHERE e.course_assignment_id = ?
             ORDER BY s.last_name, s.first_name
             LIMIT ? OFFSET ?`,
            [req.params.courseAssignmentId, limit, offset]
        );

        res.json(paginatedResponse(students, total, page, limit));
    } catch (error) {
        console.error('Get enrolled students error:', error);
        res.status(500).json({ success: false, message: 'Error fetching enrolled students' });
    }
});

export default router;
