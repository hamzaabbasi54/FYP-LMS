// ============================================
// File: backend/routes/studentRoutes.js
// Students, Parents, Enrollments CRUD Routes
// With Pagination + Excel Import/Export
// ============================================

import express from 'express';
import fs from 'fs';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAdmin, isAuthenticated } from '../middleware/auth.js';
import { scopeToDepartment } from '../middleware/deptScope.js';
import { validateMagicBytes } from '../middleware/validateMagicBytes.js';
import { deleteGuard } from '../middleware/deleteGuard.js';
import { scopeFaculty } from '../middleware/facultyScope.js';

// Students don't have a direct department_id — resolve via batch → department
const scopeStudent = scopeToDepartment('students', 'id', {
    joinQuery: `SELECT b.department_id FROM students s JOIN batches b ON s.batch_id = b.id WHERE s.id = ?`
});
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir, createExcelUpload, parseAcademicBackground } from '../utils/excel.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis.js';

const router = express.Router();
router.use(verifyToken);

// Multer config for Excel uploads (validates extension + 5MB limit)
const upload = createExcelUpload(multer);

// ===================== STUDENTS =====================

// GET all students (paginated, filterable by batch)
router.get('/', async (req, res) => {
    try {
        const { batch_id, search } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        const departmentId = (req.user.role === 'deptadmin' && req.user.department_id) ? req.user.department_id : 'all';
        const cacheKey = `students:all:batch_${batch_id || 'all'}:dept_${departmentId}:search_${search || 'none'}:page_${page}:limit_${limit}`;
        
        const cachedData = await cacheGet(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        let whereClause = 'WHERE 1=1';
        const params = [];
        if (batch_id) { whereClause += ' AND s.batch_id = ?'; params.push(batch_id); }
        // Force department scope for dept admins
        if (req.user.role === 'deptadmin' && req.user.department_id) {
            whereClause += ' AND b.department_id = ?'; params.push(req.user.department_id);
        }
        if (search) {
            whereClause += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id_number LIKE ? OR s.email LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        // Count total
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM students s LEFT JOIN batches b ON s.batch_id = b.id ${whereClause}`, params
        );

        // Get paginated data
        const [students] = await pool.query(
            `SELECT s.*, CONCAT(s.first_name, ' ', s.last_name) as name,
                    s.student_id_number as roll_number, s.phone as contact_number,
                    b.name as batch_name, d.name as department_name
             FROM students s
             LEFT JOIN batches b ON s.batch_id = b.id
             LEFT JOIN departments d ON b.department_id = d.id
             ${whereClause}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const responseData = paginatedResponse(students, total, page, limit);
        await cacheSet(cacheKey, responseData, 3600); // cache for 1 hour
        res.json(responseData);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Error fetching students' });
    }
});
// GET download blank import template (must be before /:id to avoid param conflict)
router.get('/import/template', isAdmin, (req, res) => {
    try {
        const templateData = [
            {
                student_id_number: '',
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                parent_name: '',
                parent_email: '',
                parent_phone: '',
                matric_marks: '',
                fsc_marks: '',
                background: ''
            }
        ];
        const buffer = generateExcel(templateData, 'Students Template');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Generate template error:', error);
        res.status(500).json({ success: false, message: 'Error generating template' });
    }
});

// GET single student with parent and enrollments
router.get('/:id', scopeStudent, async (req, res) => {
    try {
        const [students] = await pool.query(
            `SELECT s.*, CONCAT(s.first_name, ' ', s.last_name) as name,
                    s.student_id_number as roll_number, s.phone as contact_number,
                    b.name as batch_name, d.name as department_name
             FROM students s
             LEFT JOIN batches b ON s.batch_id = b.id
             LEFT JOIN departments d ON b.department_id = d.id
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
        const { first_name, last_name, email, phone, batch_id, student_id_number, parent, matric_marks, fsc_marks, background } = req.body;

        if (!first_name || !last_name || !email || !batch_id || !student_id_number) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'first_name, last_name, email, batch_id, and student_id_number (roll number) are required' });
        }

        const [result] = await conn.query(
            `INSERT INTO students (student_id_number, first_name, last_name, email, phone, batch_id, matric_marks, fsc_marks, background)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id_number.trim(), first_name, last_name, email.toLowerCase(), phone || '', batch_id, matric_marks || null, fsc_marks || null, background || null]
        );
        const studentId = result.insertId;

        if (parent && parent.name) {
            await conn.query(
                'INSERT INTO parents (student_id, name, email, phone) VALUES (?, ?, ?, ?)',
                [studentId, parent.name, parent.email || null, parent.phone || null]
            );
        }

        await conn.commit();
        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');
        res.status(201).json({
            success: true,
            message: 'Student registered',
            data: { id: studentId, student_id_number: student_id_number.trim(), first_name, last_name }
        });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'A student with this roll number or email already exists' });
        }
        console.error('Create student error:', error);
        res.status(500).json({ success: false, message: 'Error registering student' });
    } finally {
        conn.release();
    }
});

// PUT update student
router.put('/:id', isAdmin, scopeStudent, async (req, res) => {
    try {
        const { first_name, last_name, email, phone, batch_id, cgpa, is_active, matric_marks, fsc_marks, background, student_id_number } = req.body;
        const fields = [];
        const values = [];
        if (first_name) { fields.push('first_name = ?'); values.push(first_name); }
        if (last_name) { fields.push('last_name = ?'); values.push(last_name); }
        if (email) { fields.push('email = ?'); values.push(email.toLowerCase()); }
        if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
        if (student_id_number !== undefined) { fields.push('student_id_number = ?'); values.push(student_id_number); }
        if (batch_id !== undefined) { fields.push('batch_id = ?'); values.push(batch_id || null); }
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
        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');
        res.json({ success: true, message: 'Student updated' });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: 'Error updating student' });
    }
});

// DELETE student
router.delete('/:id', isAdmin, scopeStudent, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');
        res.json({ success: true, message: 'Student deleted' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ success: false, message: 'Error deleting student' });
    }
});

// POST bulk delete students
router.post('/bulk-delete', isAdmin, deleteGuard('students_bulk'), async (req, res) => {
    try {
        const { student_ids } = req.body;
        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No student IDs provided' });
        }

        // Department scoping: verify all students belong to deptadmin's department
        if (req.user.role === 'deptadmin') {
            const placeholders = student_ids.map(() => '?').join(',');
            const [foreignStudents] = await pool.query(
                `SELECT s.id FROM students s
                 JOIN batches b ON s.batch_id = b.id
                 WHERE s.id IN (${placeholders}) AND b.department_id != ?`,
                [...student_ids, req.user.department_id]
            );
            if (foreignStudents.length > 0) {
                return res.status(403).json({ success: false, message: 'Access denied. Some students belong to a different department.' });
            }
        }

        const placeholders = student_ids.map(() => '?').join(',');
        const [result] = await pool.query(`DELETE FROM students WHERE id IN (${placeholders})`, student_ids);

        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');
        res.json({ success: true, message: `${result.affectedRows} students deleted successfully` });
    } catch (error) {
        console.error('Bulk delete students error:', error);
        res.status(500).json({ success: false, message: 'Error deleting students' });
    }
});

// ===================== EXCEL IMPORT =====================

// POST bulk import students from Excel
router.post('/import', isAdmin, upload.single('file'), validateMagicBytes, async (req, res) => {
    const filePath = req.file?.path ?? null;
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Excel file is required. Upload as form-data with key "file".' });
    }

    let conn = null;
    try {
        const rows = parseExcel(filePath);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        // Validate required columns
        const requiredCols = ['student_id_number', 'first_name', 'last_name', 'email'];
        const missingCols = requiredCols.filter(col => !(col in rows[0]));
        if (missingCols.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required columns: ${missingCols.join(', ')}`,
                expected_columns: ['student_id_number', 'first_name', 'last_name', 'email', 'phone', 'parent_name', 'parent_email', 'parent_phone', 'matric_marks', 'fsc_marks', 'background']
            });
        }

        const targetBatchId = req.body.batch_id;

        const validRows = [];
        const preflightErrors = [];
        const seenRollNumbers = new Set();
        const seenEmails = new Set();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;
            const rowErrors = [];

            const rollNumber = String(row.student_id_number || row.roll_number || '').trim();
            const email = String(row.email || '').trim().toLowerCase();
            const firstName = String(row.first_name || '').trim();
            const lastName = String(row.last_name || '').trim();

            // Required field checks
            const rowBatchId = row.batch_id || targetBatchId;
            if (!rowBatchId) rowErrors.push('batch_id is required (not provided in request body or CSV)');
            if (!rollNumber) rowErrors.push('student_id_number is required');
            if (!firstName) rowErrors.push('first_name is required');
            if (!lastName) rowErrors.push('last_name is required');
            if (!email) rowErrors.push('email is required');

            // Email format check
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                rowErrors.push('email format is invalid');
            }

            // Phone validation — only if provided
            if (row.phone) {
                const digits = String(row.phone).replace(/[\s\-]/g, '');
                if (!/^\d{11}$/.test(digits)) rowErrors.push('phone must be 11 digits');
            }

            // Parent phone validation — only if provided
            if (row.parent_phone) {
                const digits = String(row.parent_phone).replace(/[\s\-]/g, '');
                if (!/^\d{11}$/.test(digits)) rowErrors.push('parent_phone must be 11 digits');
            }

            // In-file duplicate checks
            if (rollNumber && seenRollNumbers.has(rollNumber)) {
                rowErrors.push(`Duplicate student_id_number in file: ${rollNumber}`);
            } else if (rollNumber) {
                seenRollNumbers.add(rollNumber);
            }

            if (email && seenEmails.has(email)) {
                rowErrors.push(`Duplicate email in file: ${email}`);
            } else if (email) {
                seenEmails.add(email);
            }

            if (rowErrors.length > 0) {
                preflightErrors.push({
                    row: rowNum,
                    student_id_number: rollNumber || null,
                    email: email || null,
                    error: rowErrors.join('; ')
                });
            } else {
                validRows.push({ ...row, student_id_number: rollNumber, email, batch_id: rowBatchId });
            }
        }

        // If nothing is valid, return immediately — no DB connection
        if (validRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Import failed: all ${rows.length} rows have validation errors`,
                data: { imported: 0, skipped: preflightErrors.length, errors: preflightErrors }
            });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const studentValues = validRows.map(row => {
            const studentBatchId = row.batch_id; // already validated in pre-flight
            return [
                row.student_id_number,
                row.first_name,
                row.last_name,
                row.email,
                row.phone || '',
                studentBatchId,
                row.matric_marks || null,
                row.fsc_marks || null,
                parseAcademicBackground(row.background)
            ];
        });

        await conn.query(
            `INSERT INTO students 
                (student_id_number, first_name, last_name, email, phone, batch_id, matric_marks, fsc_marks, background)
             VALUES ?
             ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                phone = VALUES(phone),
                batch_id = VALUES(batch_id),
                matric_marks = VALUES(matric_marks),
                fsc_marks = VALUES(fsc_marks),
                background = VALUES(background)`,
            [studentValues]
        );

        const rollNumbers = validRows.map(row => row.student_id_number);

        const [studentRows] = await conn.query(
            `SELECT id, student_id_number FROM students WHERE student_id_number IN (?)`,
            [rollNumbers]
        );

        const rollNumberToStudentId = new Map(
            studentRows.map(s => [s.student_id_number, s.id])
        );

        const parentValues = validRows
            .filter(row => row.parent_name && String(row.parent_name).trim())
            .map(row => {
                const studentId = rollNumberToStudentId.get(row.student_id_number);
                return [
                    studentId,
                    String(row.parent_name).trim(),
                    row.parent_email || null,
                    row.parent_phone || null
                ];
            })
            .filter(entry => entry[0] !== undefined); // safety: skip if ID not found

        if (parentValues.length > 0) {
            await conn.query(
                `INSERT INTO parents (student_id, name, email, phone)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    phone = VALUES(phone)`,
                [parentValues]
            );
        }

        await conn.commit();
        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');

        const imported = validRows.length;
        const skipped = preflightErrors.length;

        res.json({
            success: true,
            message: `Import complete: ${imported} added, ${skipped} skipped`,
            data: {
                imported,
                skipped,
                errors: preflightErrors
            }
        });

    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch (rollbackErr) { console.error('Rollback failed:', rollbackErr); }
        }
        console.error('Import error:', error);
        res.status(500).json({
            success: false,
            message: 'Import failed due to a database error. No records were saved. Fix the file and try again.',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
        // Always delete the uploaded file
        if (filePath) {
            try {
                await fs.promises.unlink(filePath);
            } catch (cleanupErr) {
                console.error('Failed to delete uploaded file:', cleanupErr);
            }
        }
    }
});

// POST bulk import students and enroll them into a course assignment (Faculty)
router.post('/import/course/:assignmentId', isAuthenticated, upload.single('file'), validateMagicBytes, async (req, res) => {
    const filePath = req.file?.path ?? null;
    const assignmentId = parseInt(req.params.assignmentId, 10);
    
    if (isNaN(assignmentId) || assignmentId <= 0) {
        if (filePath) {
            try { await fs.promises.unlink(filePath); } catch (e) {}
        }
        return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Excel file is required. Upload as form-data with key "file".' });
    }

    let conn = null;
    try {
        const rows = parseExcel(filePath);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        // Validate required columns
        const requiredCols = ['student_id_number', 'first_name', 'last_name', 'email'];
        const missingCols = requiredCols.filter(col => !(col in rows[0]));
        if (missingCols.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required columns: ${missingCols.join(', ')}`,
                expected_columns: ['student_id_number', 'first_name', 'last_name', 'email', 'phone', 'parent_name', 'parent_email', 'parent_phone', 'matric_marks', 'fsc_marks', 'background']
            });
        }

        // Verify assignment and get batch_id before processing rows
        const [assignments] = await pool.query(
            `SELECT ca.id, s.batch_id 
             FROM course_assignments ca
             JOIN semesters s ON ca.semester_id = s.id
             WHERE ca.id = ?`,
            [assignmentId]
        );

        if (assignments.length === 0) {
            return res.status(404).json({ success: false, message: 'Course assignment not found' });
        }

        const targetBatchId = assignments[0].batch_id;

        const validRows = [];
        const preflightErrors = [];
        const seenRollNumbers = new Set();
        const seenEmails = new Set();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;
            const rowErrors = [];

            const rollNumber = String(row.student_id_number || '').trim();
            const email = String(row.email || '').trim().toLowerCase();
            const firstName = String(row.first_name || '').trim();
            const lastName = String(row.last_name || '').trim();

            // Required field checks
            const rowBatchId = row.batch_id || targetBatchId;
            if (!rowBatchId) rowErrors.push('batch_id is required');
            if (!rollNumber) rowErrors.push('student_id_number is required');
            if (!firstName) rowErrors.push('first_name is required');
            if (!lastName) rowErrors.push('last_name is required');
            if (!email) rowErrors.push('email is required');

            // Email format check
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                rowErrors.push('email format is invalid');
            }

            // Phone validation — only if provided
            if (row.phone) {
                const digits = String(row.phone).replace(/[\s\-]/g, '');
                if (!/^\d{11}$/.test(digits)) rowErrors.push('phone must be 11 digits');
            }

            // Parent phone validation — only if provided
            if (row.parent_phone) {
                const digits = String(row.parent_phone).replace(/[\s\-]/g, '');
                if (!/^\d{11}$/.test(digits)) rowErrors.push('parent_phone must be 11 digits');
            }

            // In-file duplicate checks
            if (rollNumber && seenRollNumbers.has(rollNumber)) {
                rowErrors.push(`Duplicate student_id_number in file: ${rollNumber}`);
            } else if (rollNumber) {
                seenRollNumbers.add(rollNumber);
            }

            if (email && seenEmails.has(email)) {
                rowErrors.push(`Duplicate email in file: ${email}`);
            } else if (email) {
                seenEmails.add(email);
            }

            if (rowErrors.length > 0) {
                preflightErrors.push({
                    row: rowNum,
                    student_id_number: rollNumber || null,
                    email: email || null,
                    error: rowErrors.join('; ')
                });
            } else {
                validRows.push({ ...row, student_id_number: rollNumber, email, batch_id: rowBatchId });
            }
        }

        // If nothing is valid, return immediately — no DB connection
        if (validRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Import failed: all ${rows.length} rows have validation errors`,
                data: { imported: 0, skipped: preflightErrors.length, errors: preflightErrors }
            });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const studentValues = validRows.map(row => {
            return [
                row.student_id_number,
                row.first_name,
                row.last_name,
                row.email,
                row.phone || '',
                row.batch_id, // Already validated during pre-flight
                row.matric_marks || null,
                row.fsc_marks || null,
                parseAcademicBackground(row.background)
            ];
        });

        await conn.query(
            `INSERT INTO students 
                (student_id_number, first_name, last_name, email, phone, batch_id, matric_marks, fsc_marks, background)
             VALUES ?
             ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                phone = VALUES(phone),
                batch_id = VALUES(batch_id),
                matric_marks = VALUES(matric_marks),
                fsc_marks = VALUES(fsc_marks),
                background = VALUES(background)`,
            [studentValues]
        );

        const rollNumbers = validRows.map(row => row.student_id_number);

        const [studentRows] = await conn.query(
            `SELECT id, student_id_number FROM students WHERE student_id_number IN (?)`,
            [rollNumbers]
        );

        const rollNumberToStudentId = new Map(
            studentRows.map(s => [s.student_id_number, s.id])
        );

        const parentValues = validRows
            .filter(row => row.parent_name && String(row.parent_name).trim())
            .map(row => {
                const studentId = rollNumberToStudentId.get(row.student_id_number);
                return [
                    studentId,
                    String(row.parent_name).trim(),
                    row.parent_email || null,
                    row.parent_phone || null
                ];
            })
            .filter(entry => entry[0] !== undefined); // safety: skip if ID not found

        if (parentValues.length > 0) {
            await conn.query(
                `INSERT INTO parents (student_id, name, email, phone)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    phone = VALUES(phone)`,
                [parentValues]
            );
        }

        const enrollmentValues = validRows
            .map(row => {
                const studentId = rollNumberToStudentId.get(row.student_id_number);
                return studentId ? [studentId, assignmentId] : null;
            })
            .filter(Boolean);

        if (enrollmentValues.length > 0) {
            await conn.query(
                `INSERT INTO enrollments (student_id, course_assignment_id)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE
                    student_id = VALUES(student_id)`,
                [enrollmentValues]
            );
        }

        await conn.commit();
        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');
        await cacheDelPattern('enrolledStudents:*');

        const imported = validRows.length;
        const skipped = preflightErrors.length;

        res.json({
            success: true,
            message: `Import complete: ${imported} added and enrolled, ${skipped} skipped`,
            data: {
                imported,
                skipped,
                errors: preflightErrors   // ALL errors, no slice
            }
        });

    } catch (error) {
        if (conn) {
            try { await conn.rollback(); } catch (rollbackErr) { console.error('Rollback failed:', rollbackErr); }
        }
        console.error('Import and enroll students error:', error);
        res.status(500).json({
            success: false,
            message: 'Import failed due to a database error. No records were saved. Fix the file and try again.',
            error: error.message
        });
    } finally {
        if (conn) conn.release();
        // Always delete the uploaded file
        if (filePath) {
            try {
                await fs.promises.unlink(filePath);
            } catch (cleanupErr) {
                console.error('Failed to delete uploaded file:', cleanupErr);
            }
        }
    }
});

// GET students by batch (for cross-batch enrollment picker)
router.get('/by-batch/:batchId', isAuthenticated, async (req, res) => {
    try {
        const { batchId } = req.params;
        const search = req.query.search || '';

        const cacheKey = `students:by-batch:${batchId}:search_${search || 'none'}`;
        const cachedData = await cacheGet(cacheKey);
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }

        let query = `SELECT s.id, s.student_id_number, s.first_name, s.last_name, s.email, s.phone,
                            s.batch_id, s.matric_marks, s.fsc_marks, s.background,
                            b.name as batch_name,
                            p.name as parent_name, p.email as parent_email, p.phone as parent_phone
                     FROM students s
                     LEFT JOIN batches b ON s.batch_id = b.id
                     LEFT JOIN parents p ON p.student_id = s.id
                     WHERE s.batch_id = ?`;
        const params = [batchId];

        if (search.trim()) {
            query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id_number LIKE ? OR CONCAT(s.first_name, ' ', s.last_name) LIKE ?)`;
            const searchParam = `%${search.trim()}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY s.last_name, s.first_name LIMIT 100';

        const [students] = await pool.query(query, params);
        await cacheSet(cacheKey, students, 3600);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Get students by batch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching students' });
    }
});

// GET all student IDs for a batch (for Delete All - admin only)
router.get('/by-batch/:batchId/ids', isAdmin, async (req, res) => {
    try {
        const { batchId } = req.params;

        // Department scoping: verify batch belongs to deptadmin's department
        if (req.user.role === 'deptadmin') {
            const [[batch]] = await pool.query(
                'SELECT department_id FROM batches WHERE id = ?', [batchId]
            );
            if (!batch || batch.department_id !== req.user.department_id) {
                return res.status(403).json({ success: false, message: 'Access denied. Batch belongs to a different department.' });
            }
        }

        const [students] = await pool.query(
            'SELECT id FROM students WHERE batch_id = ?',
            [batchId]
        );
        res.json({ success: true, data: students.map(s => s.id) });
    } catch (error) {
        console.error('Get student IDs error:', error);
        res.status(500).json({ success: false, message: 'Error fetching student IDs' });
    }
});

// POST single student registration and enrollment into a course assignment (Faculty)
router.post('/course/:assignmentId/register', isAuthenticated, async (req, res) => {
    const { assignmentId } = req.params;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Verify assignment and get batch_id
        const [assignments] = await conn.query(
            `SELECT ca.id, s.batch_id 
             FROM course_assignments ca
             JOIN semesters s ON ca.semester_id = s.id
             WHERE ca.id = ?`,
            [assignmentId]
        );

        if (assignments.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Course assignment not found' });
        }

        const courseBatchId = assignments[0].batch_id;
        const { first_name, last_name, email, phone, parent_name, parent_email, parent_phone, matric_marks, fsc_marks, background, student_id_number, original_batch_id } = req.body;

        if (!first_name || !last_name || !email || !student_id_number) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'first_name, last_name, email, and student_id_number (roll number) are required' });
        }

        const rollNumber = student_id_number.trim();

        // If original_batch_id is provided, the student is from a different batch.
        // Use the student's home batch_id for the students table, not the course's batch.
        const studentBatchId = original_batch_id || courseBatchId;

        const [result] = await conn.query(
            `INSERT INTO students (student_id_number, first_name, last_name, email, phone, batch_id, matric_marks, fsc_marks, background)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                id = LAST_INSERT_ID(id),
                first_name = VALUES(first_name), 
                last_name = VALUES(last_name), 
                phone = VALUES(phone), 
                matric_marks = VALUES(matric_marks),
                fsc_marks = VALUES(fsc_marks),
                background = VALUES(background)`,
            [rollNumber, first_name, last_name, String(email).toLowerCase(), phone || '', studentBatchId, matric_marks || null, fsc_marks || null, background || null]
        );

        const studentId = result.insertId;

        // Insert parent if provided
        if (parent_name && studentId) {
            await conn.query(
                'INSERT INTO parents (student_id, name, email, phone) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone)',
                [studentId, parent_name, parent_email || null, parent_phone || null]
            );
        }

        // Enroll student in the course assignment
        // Record original_batch_id if student is from a different batch
        if (studentId) {
            const enrollOriginalBatchId = (original_batch_id && original_batch_id !== courseBatchId) ? original_batch_id : null;
            await conn.query(
                `INSERT INTO enrollments (student_id, course_assignment_id, original_batch_id) VALUES (?, ?, ?)`,
                [studentId, assignmentId, enrollOriginalBatchId]
            );
        }

        await conn.commit();
        await cacheDelPattern('students:*');
        await cacheDelPattern('parents:*');
        await cacheDelPattern('dashboard:*');
        await cacheDelPattern('enrolledStudents:*');
        res.status(201).json({
            success: true,
            message: 'Student registered and enrolled successfully',
            data: { id: studentId, student_id_number: rollNumber }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Register and enroll student error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Student is already enrolled in this course.' });
        }
        res.status(500).json({ success: false, message: 'Error registering and enrolling student' });
    } finally {
        conn.release();
    }
});

// DELETE unenroll student from a course (Faculty-scoped)
router.delete('/course/:assignmentId/unenroll/:studentId', isAuthenticated, scopeFaculty('course_assignment', 'params', 'assignmentId'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { assignmentId, studentId } = req.params;

        // 1. Delete grades and question_grades
        const [assessments] = await conn.query('SELECT id FROM assessments WHERE course_assignment_id = ?', [assignmentId]);
        if (assessments.length > 0) {
            const assessmentIds = assessments.map(a => a.id);
            await conn.query('DELETE FROM question_grades WHERE student_id = ? AND assessment_id IN (?)', [studentId, assessmentIds]);
            await conn.query('DELETE FROM grades WHERE student_id = ? AND assessment_id IN (?)', [studentId, assessmentIds]);
        }

        // 2. Delete attendance
        await conn.query('DELETE FROM attendance WHERE student_id = ? AND course_assignment_id = ?', [studentId, assignmentId]);

        // 3. Delete enrollment
        const [result] = await conn.query(
            'DELETE FROM enrollments WHERE student_id = ? AND course_assignment_id = ?',
            [studentId, assignmentId]
        );
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }
        
        await conn.commit();
        await cacheDelPattern('enrolledStudents:*');
        await cacheDelPattern('obe:*');
        res.json({ success: true, message: 'Student unenrolled and related records cleared successfully' });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Unenroll student (faculty) error:', error);
        res.status(500).json({ success: false, message: 'Error unenrolling student' });
    } finally {
        if (conn) conn.release();
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
            `INSERT INTO parents(student_id, name, email, phone) VALUES(?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone)`,
            [req.params.studentId, name, email || null, phone || null]
        );
        await cacheDelPattern('parents:*');
        await cacheDelPattern('students:*');
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
        await cacheDelPattern('enrolledStudents:*');
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
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[enrollment]] = await conn.query('SELECT student_id, course_assignment_id FROM enrollments WHERE id = ?', [req.params.id]);
        if (!enrollment) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        const { student_id, course_assignment_id } = enrollment;

        // 1. Delete grades and question_grades
        const [assessments] = await conn.query('SELECT id FROM assessments WHERE course_assignment_id = ?', [course_assignment_id]);
        if (assessments.length > 0) {
            const assessmentIds = assessments.map(a => a.id);
            await conn.query('DELETE FROM question_grades WHERE student_id = ? AND assessment_id IN (?)', [student_id, assessmentIds]);
            await conn.query('DELETE FROM grades WHERE student_id = ? AND assessment_id IN (?)', [student_id, assessmentIds]);
        }

        // 2. Delete attendance
        await conn.query('DELETE FROM attendance WHERE student_id = ? AND course_assignment_id = ?', [student_id, course_assignment_id]);

        await conn.query('DELETE FROM enrollments WHERE id = ?', [req.params.id]);

        await conn.commit();
        await cacheDelPattern('enrolledStudents:*');
        await cacheDelPattern('obe:*');
        res.json({ success: true, message: 'Student unenrolled and related records cleared' });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Unenroll student error:', error);
        res.status(500).json({ success: false, message: 'Error unenrolling student' });
    } finally {
        if (conn) conn.release();
    }
});

router.get('/enrolled/:courseAssignmentId', async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const cacheKey = `enrolledStudents:${req.params.courseAssignmentId}:p${page}:l${limit}`;

        const cachedData = await cacheGet(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM enrollments WHERE course_assignment_id = ?',
            [req.params.courseAssignmentId]
        );

        const [students] = await pool.query(
            `SELECT s.*, e.id as enrollment_id, e.created_at as enrolled_at
             FROM students s
             JOIN enrollments e ON s.id = e.student_id
             WHERE e.course_assignment_id = ?
        ORDER BY s.last_name, s.first_name
    LIMIT ? OFFSET ? `,
            [req.params.courseAssignmentId, limit, offset]
        );

        const responseData = paginatedResponse(students, total, page, limit);
        await cacheSet(cacheKey, JSON.stringify(responseData), 2592000); // 30 days
        res.json(responseData);
    } catch (error) {
        console.error('Get enrolled students error:', error);
        res.status(500).json({ success: false, message: 'Error fetching enrolled students' });
    }
});

// ===================== STUDENT PORTAL (ME) =====================

// GET student grades
router.get('/student/me/grades', isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const [grades] = await pool.query(
            `SELECT g.score, g.remarks, g.graded_at,
                    a.title as assessment_title, a.type as assessment_type, a.max_score, a.weight, a.release_grades_on,
                    c.title as course_title, c.code as course_code
             FROM grades g
             JOIN assessments a ON g.assessment_id = a.id
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             JOIN courses c ON ca.course_id = c.id
             WHERE g.student_id = ? AND (a.release_grades_on IS NULL OR a.release_grades_on <= NOW())
             ORDER BY a.release_grades_on DESC, a.conducted_date DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: grades });
    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({ success: false, message: 'Error fetching grades' });
    }
});

// GET student attendance
router.get('/student/me/attendance', isAuthenticated, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const [attendance] = await pool.query(
            `SELECT a.date, a.status, a.duration_hours,
                    c.title as course_title, c.code as course_code
             FROM attendance a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             JOIN courses c ON ca.course_id = c.id
             WHERE a.student_id = ?
             ORDER BY a.date DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: attendance });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ success: false, message: 'Error fetching attendance' });
    }
});

export default router;
