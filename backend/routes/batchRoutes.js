// ============================================
// File: backend/routes/batchRoutes.js
// Batches, Semesters, PLOs CRUD Routes
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/course_content/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const router = express.Router();
router.use(verifyToken);

// ===================== BATCHES =====================

// GET all batches (paginated, with stats)
router.get('/', async (req, res) => {
    try {
        const { department_id: queryDeptId, status: batchStatus } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        // Force department scope for dept admins
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : queryDeptId;

        let whereClause = 'WHERE 1=1';
        const params = [];
        if (department_id) { whereClause += ' AND b.department_id = ?'; params.push(department_id); }
        if (batchStatus) { whereClause += ' AND b.status = ?'; params.push(batchStatus); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM batches b ${whereClause}`, params
        );

        const [batches] = await pool.query(
            `SELECT b.*, d.name as department_name, f.name as faculty_name,
                    cur.name as curriculum_name,
                    (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) as student_count,
                    (SELECT COUNT(*) FROM semesters s WHERE s.batch_id = b.id) as semester_count
             FROM batches b
             JOIN departments d ON b.department_id = d.id
             JOIN faculties f ON d.faculty_id = f.id
             LEFT JOIN curricula cur ON b.curriculum_id = cur.id
             ${whereClause}
             ORDER BY b.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json(paginatedResponse(batches, total, page, limit));
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({ success: false, message: 'Error fetching batches' });
    }
});

// GET single batch with PLOs and semesters
router.get('/:id', async (req, res) => {
    try {
        const [batches] = await pool.query(
            `SELECT b.*, d.name as department_name, f.name as faculty_name,
                    cur.name as curriculum_name,
                    (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) as student_count
             FROM batches b
             JOIN departments d ON b.department_id = d.id
             JOIN faculties f ON d.faculty_id = f.id
             LEFT JOIN curricula cur ON b.curriculum_id = cur.id
             WHERE b.id = ?`,
            [req.params.id]
        );
        if (batches.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const [semesters] = await pool.query(
            `SELECT s.*,
                    (SELECT COUNT(*) FROM course_assignments ca WHERE ca.semester_id = s.id) as course_count
             FROM semesters s WHERE s.batch_id = ? ORDER BY s.semester_number`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: { ...batches[0], semesters }
        });
    } catch (error) {
        console.error('Get batch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching batch' });
    }
});

// POST create batch with PLOs
router.post('/', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { name, department_id, start_date, end_date, is_active, plo_ids, curriculum_id } = req.body;

        let final_department_id = department_id;
        if (req.user.role === 'deptadmin') {
            final_department_id = req.user.department_id;
        }

        if (!name || !final_department_id || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'name, department_id, start_date, end_date are required' });
        }

        const [result] = await conn.query(
            'INSERT INTO batches (name, department_id, curriculum_id, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [name, final_department_id, curriculum_id || null, start_date, end_date, is_active || false]
        );
        const batchId = result.insertId;

        if (plo_ids && Array.isArray(plo_ids) && plo_ids.length > 0) {
            const ploValues = plo_ids.map(ploId => [batchId, ploId]);
            await conn.query('INSERT INTO batch_plos (batch_id, plo_id) VALUES ?', [ploValues]);
        }

        if (curriculum_id) {
            await conn.query(
                `INSERT INTO batch_semester_courses (batch_id, semester_number, course_id, type)
                 SELECT ?, cs.semester_number, csc.course_id, csc.type
                 FROM curriculum_semester_courses csc
                 JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id
                 WHERE cs.curriculum_id = ?`,
                [batchId, curriculum_id]
            );
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: 'Batch created',
            data: { id: batchId, name }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Create batch error:', error);
        res.status(500).json({ success: false, message: 'Error creating batch' });
    } finally {
        conn.release();
    }
});

// PUT update batch (with curriculum copy-on-assign)
router.put('/:id', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { name, start_date, end_date, status, is_active, curriculum_id } = req.body;
        const fields = [];
        const values = [];
        if (name) { fields.push('name = ?'); values.push(name); }
        if (start_date) { fields.push('start_date = ?'); values.push(start_date); }
        if (end_date) { fields.push('end_date = ?'); values.push(end_date); }
        if (status) { fields.push('status = ?'); values.push(status); }
        if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
        if (curriculum_id !== undefined) { fields.push('curriculum_id = ?'); values.push(curriculum_id || null); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        await conn.beginTransaction();
        values.push(req.params.id);
        const [result] = await conn.query(`UPDATE batches SET ${fields.join(', ')} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        // If curriculum_id changed, copy curriculum courses to batch_semester_courses
        if (curriculum_id !== undefined) {
            // Clear old batch courses
            await conn.query('DELETE FROM batch_semester_courses WHERE batch_id = ?', [req.params.id]);

            if (curriculum_id) {
                await conn.query(
                    `INSERT INTO batch_semester_courses (batch_id, semester_number, course_id, type)
                     SELECT ?, cs.semester_number, csc.course_id, csc.type
                     FROM curriculum_semester_courses csc
                     JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id
                     WHERE cs.curriculum_id = ?`,
                    [req.params.id, curriculum_id]
                );
            }
        }

        const { plo_ids } = req.body;
        if (plo_ids && Array.isArray(plo_ids)) {
            await conn.query('DELETE FROM batch_plos WHERE batch_id = ?', [req.params.id]);
            if (plo_ids.length > 0) {
                const ploValues = plo_ids.map(ploId => [req.params.id, ploId]);
                await conn.query('INSERT INTO batch_plos (batch_id, plo_id) VALUES ?', [ploValues]);
            }
        }

        await conn.commit();
        res.json({ success: true, message: 'Batch updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Update batch error:', error);
        res.status(500).json({ success: false, message: 'Error updating batch' });
    } finally {
        conn.release();
    }
});

// DELETE batch
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM batches WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        res.json({ success: true, message: 'Batch deleted' });
    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({ success: false, message: 'Error deleting batch' });
    }
});

// ===================== BATCH CURRICULUM COURSES =====================

// GET batch courses (grouped by semester) — reads from batch_semester_courses
router.get('/:id/curriculum-courses', async (req, res) => {
    try {
        const [batch] = await pool.query(
            `SELECT b.*, cur.name as curriculum_name, cur.total_semesters
             FROM batches b
             LEFT JOIN curricula cur ON b.curriculum_id = cur.id
             WHERE b.id = ?`,
            [req.params.id]
        );

        if (batch.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const totalSemesters = batch[0].total_semesters || 8;

        // Build semester structure
        const semesters = [];
        for (let i = 1; i <= totalSemesters; i++) {
            // Try fetching batch-specific overrides first
            let [courses] = await pool.query(
                `SELECT bsc.id as entry_id, c.id as course_id, c.title, c.code, 
                        c.credit_hours, c.description, bsc.type, d.name as department_name
                 FROM batch_semester_courses bsc
                 JOIN courses c ON bsc.course_id = c.id
                 JOIN departments d ON c.department_id = d.id
                 WHERE bsc.batch_id = ? AND bsc.semester_number = ?
                 ORDER BY bsc.type, c.code`,
                [req.params.id, i]
            );

            // FALLBACK: If no batch-specific courses exist but batch has a curriculum,
            // fetch from the master curriculum blueprint
            if (courses.length === 0 && batch[0].curriculum_id) {
                [courses] = await pool.query(
                    `SELECT NULL as entry_id, c.id as course_id, c.title, c.code, 
                            c.credit_hours, c.description, csc.type, d.name as department_name
                     FROM curriculum_semester_courses csc
                     JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id
                     JOIN courses c ON csc.course_id = c.id
                     JOIN departments d ON c.department_id = d.id
                     WHERE cs.curriculum_id = ? AND cs.semester_number = ?
                     ORDER BY csc.type, c.code`,
                    [batch[0].curriculum_id, i]
                );
            }

            semesters.push({
                semester_number: i,
                name: `Semester ${i}`,
                courses
            });
        }

        res.json({
            success: true,
            data: {
                curriculum_id: batch[0].curriculum_id,
                curriculum_name: batch[0].curriculum_name,
                total_semesters: totalSemesters,
                semesters
            }
        });
    } catch (error) {
        console.error('Get batch curriculum courses error:', error);
        res.status(500).json({ success: false, message: 'Error fetching batch courses' });
    }
});

// POST add course(s) to a batch semester
router.post('/:id/semesters/:semNum/courses', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { course_id, course_ids, type } = req.body;
        const courseType = type || 'core';
        const batchId = req.params.id;
        const semNum = parseInt(req.params.semNum);

        // Validation
        if (isNaN(semNum) || semNum < 1 || semNum > 8) {
            return res.status(400).json({ success: false, message: 'Invalid semester number. Must be 1-8.' });
        }
        if (!['core', 'elective'].includes(courseType)) {
            return res.status(400).json({ success: false, message: 'Invalid course type. Must be "core" or "elective".' });
        }

        const ids = course_ids && Array.isArray(course_ids) ? course_ids : (course_id ? [course_id] : []);
        if (ids.length === 0) {
            return res.status(400).json({ success: false, message: 'course_id or course_ids array is required' });
        }

        await conn.beginTransaction();

        const added = [];
        const errors = [];

        for (const cId of ids) {
            try {
                // Check if course already exists in ANY semester of this batch
                const [existing] = await conn.query(
                    'SELECT id, semester_number FROM batch_semester_courses WHERE batch_id = ? AND course_id = ?',
                    [batchId, cId]
                );

                if (existing.length > 0) {
                    errors.push({ course_id: cId, error: `Already in Semester ${existing[0].semester_number}` });
                    continue;
                }

                await conn.query(
                    'INSERT INTO batch_semester_courses (batch_id, semester_number, course_id, type) VALUES (?, ?, ?, ?)',
                    [batchId, semNum, cId, courseType]
                );
                added.push(cId);
            } catch (err) {
                console.error(`Error adding course ${cId} to batch ${batchId}:`, err);
                errors.push({ course_id: cId, error: 'Failed to process course entry' });
            }
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: `${added.length} course(s) added to semester ${semNum}`,
            data: { added, errors }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Add batch course error:', error);
        res.status(500).json({ success: false, message: 'Error adding courses' });
    } finally {
        conn.release();
    }
});

// DELETE remove a course from a batch semester (with copy-on-write from curriculum)
router.delete('/:id/semesters/:semNum/courses/:courseId', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const batchId = req.params.id;
        const semNum = req.params.semNum;
        const courseId = req.params.courseId;

        await conn.beginTransaction();

        // Check if batch_semester_courses has ANY rows for this batch
        const [existing] = await conn.query(
            'SELECT COUNT(*) as cnt FROM batch_semester_courses WHERE batch_id = ?',
            [batchId]
        );

        // If empty, materialize from curriculum first (copy-on-write)
        if (existing[0].cnt === 0) {
            const [batch] = await conn.query('SELECT curriculum_id FROM batches WHERE id = ?', [batchId]);
            if (batch.length > 0 && batch[0].curriculum_id) {
                await conn.query(
                    `INSERT INTO batch_semester_courses (batch_id, semester_number, course_id, type)
                     SELECT ?, cs.semester_number, csc.course_id, csc.type
                     FROM curriculum_semester_courses csc
                     JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id
                     WHERE cs.curriculum_id = ?`,
                    [batchId, batch[0].curriculum_id]
                );
            }
        }

        // Now delete the specific course
        const [result] = await conn.query(
            'DELETE FROM batch_semester_courses WHERE batch_id = ? AND semester_number = ? AND course_id = ?',
            [batchId, semNum, courseId]
        );

        await conn.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not in this semester' });
        }
        res.json({ success: true, message: 'Course removed from batch semester' });
    } catch (error) {
        await conn.rollback();
        console.error('Remove batch course error:', error);
        res.status(500).json({ success: false, message: 'Error removing course' });
    } finally {
        conn.release();
    }
});

// ===================== SEMESTERS =====================

// GET semesters for a batch (with course list)
router.get('/:batchId/semesters', async (req, res) => {
    try {
        const [semesters] = await pool.query(
            `SELECT s.*,
                    (SELECT COUNT(*) FROM course_assignments ca WHERE ca.semester_id = s.id) as course_count
             FROM semesters s WHERE s.batch_id = ? ORDER BY s.semester_number`,
            [req.params.batchId]
        );
        res.json({ success: true, data: semesters });
    } catch (error) {
        console.error('Get semesters error:', error);
        res.status(500).json({ success: false, message: 'Error fetching semesters' });
    }
});

// GET single semester with courses
router.get('/:batchId/semesters/:semId', async (req, res) => {
    try {
        const [semesters] = await pool.query('SELECT * FROM semesters WHERE id = ?', [req.params.semId]);
        if (semesters.length === 0) {
            return res.status(404).json({ success: false, message: 'Semester not found' });
        }

        const [courses] = await pool.query(
            `SELECT ca.id as assignment_id, c.id as course_id, c.title, c.code, c.credit_hours,
                    u.full_name as instructor_name
             FROM course_assignments ca
             JOIN courses c ON ca.course_id = c.id
             LEFT JOIN users u ON ca.faculty_id = u.id
             WHERE ca.semester_id = ?
             ORDER BY c.code`,
            [req.params.semId]
        );

        res.json({ success: true, data: { ...semesters[0], courses } });
    } catch (error) {
        console.error('Get semester error:', error);
        res.status(500).json({ success: false, message: 'Error fetching semester' });
    }
});

// POST create semester
router.post('/:batchId/semesters', isAdmin, async (req, res) => {
    try {
        const { name, semester_number, term, start_date, end_date } = req.body;
        if (!name || !semester_number) {
            return res.status(400).json({ success: false, message: 'name and semester_number are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO semesters (batch_id, name, semester_number, term, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [req.params.batchId, name, semester_number, term || null, start_date || null, end_date || null]
        );
        res.status(201).json({
            success: true,
            message: 'Semester created',
            data: { id: result.insertId, name, semester_number }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Semester number already exists for this batch' });
        }
        console.error('Create semester error:', error);
        res.status(500).json({ success: false, message: 'Error creating semester' });
    }
});

// PUT update semester
router.put('/:batchId/semesters/:semId', isAdmin, async (req, res) => {
    try {
        const { name, term, start_date, end_date } = req.body;
        const fields = [];
        const values = [];
        if (name) { fields.push('name = ?'); values.push(name); }
        if (term) { fields.push('term = ?'); values.push(term); }
        if (start_date) { fields.push('start_date = ?'); values.push(start_date); }
        if (end_date) { fields.push('end_date = ?'); values.push(end_date); }
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        values.push(req.params.semId);
        await pool.query(`UPDATE semesters SET ${fields.join(', ')} WHERE id = ?`, values);
        res.json({ success: true, message: 'Semester updated' });
    } catch (error) {
        console.error('Update semester error:', error);
        res.status(500).json({ success: false, message: 'Error updating semester' });
    }
});

// DELETE semester
router.delete('/:batchId/semesters/:semId', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM semesters WHERE id = ?', [req.params.semId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Semester not found' });
        }
        res.json({ success: true, message: 'Semester deleted' });
    } catch (error) {
        console.error('Delete semester error:', error);
        res.status(500).json({ success: false, message: 'Error deleting semester' });
    }
});

// NOTE: BATCH COURSES add/delete routes are defined earlier in the file (~line 306-420)
// Do NOT add duplicate route handlers here — Express matches the first definition.


// POST assign faculty to a batch course
router.post('/:batchId/semesters/:semesterNumber/courses/:courseId/assign', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { batchId, semesterNumber, courseId } = req.params;
        const { faculty_id } = req.body;
        
        await conn.beginTransaction();

        // 1. Ensure the semester exists in the `semesters` table
        let [semesters] = await conn.query(
            'SELECT id FROM semesters WHERE batch_id = ? AND semester_number = ?',
            [batchId, semesterNumber]
        );
        let semesterId;
        if (semesters.length === 0) {
            const [result] = await conn.query(
                'INSERT INTO semesters (batch_id, name, semester_number) VALUES (?, ?, ?)',
                [batchId, `Semester ${semesterNumber}`, semesterNumber]
            );
            semesterId = result.insertId;
        } else {
            semesterId = semesters[0].id;
        }

        // 2. Check if course_assignment exists
        let [assignments] = await conn.query(
            'SELECT id FROM course_assignments WHERE semester_id = ? AND course_id = ?',
            [semesterId, courseId]
        );

        if (assignments.length === 0) {
            await conn.query(
                'INSERT INTO course_assignments (semester_id, course_id, faculty_id) VALUES (?, ?, ?)',
                [semesterId, courseId, faculty_id || null]
            );
        } else {
            await conn.query(
                'UPDATE course_assignments SET faculty_id = ? WHERE id = ?',
                [faculty_id || null, assignments[0].id]
            );
        }

        await conn.commit();
        res.json({ success: true, message: 'Faculty assigned successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Assign faculty error:', error);
        res.status(500).json({ success: false, message: 'Error assigning faculty' });
    } finally {
        conn.release();
    }
});

// POST upload course content file
router.post('/:batchId/semesters/:semesterNumber/courses/:courseId/upload', isAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { batchId, semesterNumber, courseId } = req.params;

        // Ensure semester exists
        let [semesters] = await pool.query(
            'SELECT id FROM semesters WHERE batch_id = ? AND semester_number = ?',
            [batchId, semesterNumber]
        );
        let semesterId;
        if (semesters.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO semesters (batch_id, name, semester_number) VALUES (?, ?, ?)',
                [batchId, `Semester ${semesterNumber}`, semesterNumber]
            );
            semesterId = result.insertId;
        } else {
            semesterId = semesters[0].id;
        }

        // Ensure course_assignment exists
        let [assignments] = await pool.query(
            'SELECT id FROM course_assignments WHERE semester_id = ? AND course_id = ?',
            [semesterId, courseId]
        );
        
        let assignmentId;
        if (assignments.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO course_assignments (semester_id, course_id, faculty_id) VALUES (?, ?, ?)',
                [semesterId, courseId, null]
            );
            assignmentId = result.insertId;
        } else {
            assignmentId = assignments[0].id;
        }

        const filePath = `/uploads/course_content/${req.file.filename}`;
        
        await pool.query(
            'INSERT INTO course_assignment_files (course_assignment_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)',
            [assignmentId, req.file.originalname, filePath, req.file.mimetype]
        );

        res.status(201).json({ success: true, message: 'File uploaded successfully', data: { filePath } });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, message: 'Error uploading file' });
    }
});
// ===================== CLASS SCHEDULES =====================

// GET course details in the context of a batch (includes assigned faculty)
router.get('/:batchId/courses/:courseId/details', async (req, res) => {
    try {
        const { batchId, courseId } = req.params;

        const [batches] = await pool.query(
            `SELECT b.id, b.name as batch_name, b.status, b.curriculum_id FROM batches b WHERE b.id = ?`,
            [batchId]
        );
        if (batches.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        const batch = batches[0];

        const [courses] = await pool.query(
            `SELECT c.id, c.title, c.code, c.credit_hours, c.description, d.name as department_name, 
                    COALESCE(bsc.semester_number, cs.semester_number) as semester_number
             FROM courses c
             JOIN departments d ON c.department_id = d.id
             LEFT JOIN batch_semester_courses bsc ON c.id = bsc.course_id AND bsc.batch_id = ?
             LEFT JOIN curriculum_semester_courses csc ON c.id = csc.course_id
             LEFT JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id AND cs.curriculum_id = ?
             WHERE c.id = ?
             LIMIT 1`,
            [batchId, batch.curriculum_id, courseId]
        );
        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Find the faculty assigned to this course in this batch
        const [assignments] = await pool.query(
            `SELECT ca.id as assignment_id, ca.faculty_id, u.full_name as faculty_name
             FROM course_assignments ca
             JOIN semesters s ON ca.semester_id = s.id
             LEFT JOIN users u ON ca.faculty_id = u.id
             WHERE ca.course_id = ? AND s.batch_id = ?
             LIMIT 1`,
            [courseId, batchId]
        );

        let files = [];
        if (assignments.length > 0) {
            const [assignmentFiles] = await pool.query(
                `SELECT id, file_name, file_path, file_type, uploaded_at
                 FROM course_assignment_files
                 WHERE course_assignment_id = ?`,
                [assignments[0].assignment_id]
            );
            files = assignmentFiles;
        }

        // Fetch CLOs and map them to batch PLOs
        const [clos] = await pool.query(
            `SELECT c.id, c.title, c.clo_number, c.description, 
                    GROUP_CONCAT(m.plo_id) as mapped_plo_ids
             FROM clos c
             LEFT JOIN batch_clo_plo_mapping m ON c.id = m.clo_id AND m.batch_id = ?
             WHERE c.course_id = ?
             GROUP BY c.id`,
            [batchId, courseId]
        );

        res.json({
            success: true,
            data: {
                ...courses[0],
                batch: batches.length > 0 ? batches[0] : null,
                assignment: assignments.length > 0 ? assignments[0] : null,
                files,
                clos
            }
        });
    } catch (error) {
        console.error('Get batch course details error:', error);
        res.status(500).json({ success: false, message: 'Error fetching course details' });
    }
});

// GET weekly schedule for a course in a batch
router.get('/:batchId/courses/:courseId/schedule', async (req, res) => {
    try {
        const { batchId, courseId } = req.params;
        const [schedule] = await pool.query(
            `SELECT id, day_of_week, start_time, end_time, shift
             FROM class_schedules
             WHERE batch_id = ? AND course_id = ?
             ORDER BY FIELD(day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday')`,
            [batchId, courseId]
        );
        res.json({ success: true, data: schedule });
    } catch (error) {
        console.error('Get class schedule error:', error);
        res.status(500).json({ success: false, message: 'Error fetching schedule' });
    }
});

// PUT save/update weekly schedule for a course in a batch (admin only)
router.put('/:batchId/courses/:courseId/schedule', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { batchId, courseId } = req.params;
        const { schedule } = req.body; // array of { day_of_week, start_time, end_time, shift }

        if (!Array.isArray(schedule)) {
            return res.status(400).json({ success: false, message: 'schedule array is required' });
        }

        // Look up the faculty assigned to this course in this batch
        const [assignments] = await conn.query(
            `SELECT ca.faculty_id
             FROM course_assignments ca
             JOIN semesters s ON ca.semester_id = s.id
             WHERE ca.course_id = ? AND s.batch_id = ?
             LIMIT 1`,
            [courseId, batchId]
        );
        const facultyId = assignments.length > 0 ? assignments[0].faculty_id : null;

        await conn.beginTransaction();

        // Delete existing schedule for this course in this batch
        await conn.query(
            'DELETE FROM class_schedules WHERE batch_id = ? AND course_id = ?',
            [batchId, courseId]
        );

        // Insert new schedule entries
        if (schedule.length > 0) {
            const values = schedule.map(entry => [
                batchId,
                courseId,
                facultyId,
                entry.day_of_week,
                entry.start_time,
                entry.end_time,
                entry.shift || 'morning'
            ]);
            await conn.query(
                `INSERT INTO class_schedules (batch_id, course_id, faculty_id, day_of_week, start_time, end_time, shift)
                 VALUES ?`,
                [values]
            );
        }

        await conn.commit();
        res.json({
            success: true,
            message: `Schedule saved — ${schedule.length} day(s) configured`
        });
    } catch (error) {
        await conn.rollback();
        console.error('Save class schedule error:', error);
        res.status(500).json({ success: false, message: 'Error saving schedule' });
    } finally {
        conn.release();
    }
});

// ===================== BATCH PLOS =====================

// GET /api/batches/:id/plos - Fetch PLOs attached to a specific batch
router.get('/:id/plos', async (req, res) => {
    try {
        const [plos] = await pool.query(
            `SELECT p.id, p.plo_number, p.description 
             FROM batch_plos bp
             JOIN plos p ON bp.plo_id = p.id
             WHERE bp.batch_id = ?
             ORDER BY p.plo_number`,
            [req.params.id]
        );
        res.json({ success: true, data: plos });
    } catch (error) {
        console.error('Error fetching batch PLOs:', error);
        res.status(500).json({ success: false, message: 'Error fetching batch PLOs' });
    }
});

// POST update all batch PLOs
router.post('/:id/plos', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { plo_ids } = req.body;
        await conn.beginTransaction();
        await conn.query('DELETE FROM batch_plos WHERE batch_id = ?', [req.params.id]);
        
        if (plo_ids && Array.isArray(plo_ids) && plo_ids.length > 0) {
            const ploValues = plo_ids.map(ploId => [req.params.id, ploId]);
            await conn.query('INSERT INTO batch_plos (batch_id, plo_id) VALUES ?', [ploValues]);
        }
        await conn.commit();
        res.json({ success: true, message: 'Batch PLOs updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Update batch PLOs error:', error);
        res.status(500).json({ success: false, message: 'Error updating batch PLOs' });
    } finally {
        conn.release();
    }
});

// DELETE single PLO from batch
router.delete('/:id/plos/:ploId', isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM batch_plos WHERE batch_id = ? AND plo_id = ?', [req.params.id, req.params.ploId]);
        res.json({ success: true, message: 'PLO removed from batch' });
    } catch (error) {
        console.error('Delete batch PLO error:', error);
        res.status(500).json({ success: false, message: 'Error removing PLO' });
    }
});

// ===================== CLO-PLO MAPPING =====================

// GET CLO-PLO mappings for a batch
router.get('/:id/clo-mappings', async (req, res) => {
    try {
        const [mappings] = await pool.query(
            'SELECT clo_id, plo_id FROM batch_clo_plo_mapping WHERE batch_id = ?',
            [req.params.id]
        );
        res.json({ success: true, data: mappings });
    } catch (error) {
        console.error('Error fetching CLO-PLO mappings:', error);
        res.status(500).json({ success: false, message: 'Error fetching mappings' });
    }
});

// POST save CLO-PLO mappings for a batch
router.post('/:id/clo-mappings', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { mappings, course_id } = req.body; // Array of { clo_id, plo_id }
        await conn.beginTransaction();
        
        // Delete existing mappings for this batch (optionally scoped to a course)
        if (course_id) {
            await conn.query(`
                DELETE m FROM batch_clo_plo_mapping m
                JOIN clos c ON m.clo_id = c.id
                WHERE m.batch_id = ? AND c.course_id = ?
            `, [req.params.id, course_id]);
        } else {
            await conn.query('DELETE FROM batch_clo_plo_mapping WHERE batch_id = ?', [req.params.id]);
        }
        
        // Insert new mappings
        if (mappings && Array.isArray(mappings) && mappings.length > 0) {
            const values = mappings.map(m => [req.params.id, m.clo_id, m.plo_id]);
            await conn.query(
                'INSERT INTO batch_clo_plo_mapping (batch_id, clo_id, plo_id) VALUES ?',
                [values]
            );
        }
        
        await conn.commit();
        res.json({ success: true, message: 'CLO-PLO mappings saved successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Error saving CLO-PLO mappings:', error);
        res.status(500).json({ success: false, message: 'Error saving mappings' });
    } finally {
        conn.release();
    }
});

export default router;

