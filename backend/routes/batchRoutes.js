// ============================================
// File: backend/routes/batchRoutes.js
// Batches, Semesters, PLOs CRUD Routes
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();
router.use(verifyToken);

// ===================== BATCHES =====================

// GET all batches (paginated, with stats)
router.get('/', async (req, res) => {
    try {
        const { department_id, status: batchStatus } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

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
        const { name, department_id, start_date, end_date, is_active, plos, curriculum_id } = req.body;

        if (!name || !department_id || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'name, department_id, start_date, end_date are required' });
        }

        const [result] = await conn.query(
            'INSERT INTO batches (name, department_id, curriculum_id, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [name, department_id, curriculum_id || null, start_date, end_date, is_active || false]
        );
        const batchId = result.insertId;

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
                // Copy all courses from curriculum into batch_semester_courses
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

// DELETE remove a course from a batch semester
router.delete('/:id/semesters/:semNum/courses/:courseId', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM batch_semester_courses WHERE batch_id = ? AND semester_number = ? AND course_id = ?',
            [req.params.id, req.params.semNum, req.params.courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not in this semester' });
        }
        res.json({ success: true, message: 'Course removed from batch semester' });
    } catch (error) {
        console.error('Remove batch course error:', error);
        res.status(500).json({ success: false, message: 'Error removing course' });
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

export default router;

