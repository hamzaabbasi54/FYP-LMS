// ============================================
// File: backend/routes/curriculumRoutes.js
// Curriculum Management CRUD Routes
// ============================================

import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { scopeToDepartment } from '../middleware/deptScope.js';

const scopeCurriculum = scopeToDepartment('curricula');
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();
router.use(verifyToken);

// ===================== CURRICULA =====================

// GET all curricula (paginated, with stats)
router.get('/', async (req, res) => {
    try {
        const { department_id: queryDeptId, search, status } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        // Force department scope for dept admins
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : queryDeptId;

        let whereClause = 'WHERE 1=1';
        const params = [];
        if (department_id) { whereClause += ' AND c.department_id = ?'; params.push(department_id); }
        if (status) { whereClause += ' AND c.status = ?'; params.push(status); }
        if (search) {
            whereClause += ' AND (c.name LIKE ? OR d.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM curricula c
             JOIN departments d ON c.department_id = d.id
             ${whereClause}`, params
        );

        const [curricula] = await pool.query(
            `SELECT c.*, d.name as department_name, f.name as faculty_name,
                    (SELECT COUNT(DISTINCT csc.course_id) 
                     FROM curriculum_semester_courses csc 
                     JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id 
                     WHERE cs.curriculum_id = c.id) as total_courses,
                    (SELECT COUNT(*) FROM batches b WHERE b.curriculum_id = c.id) as batch_count
             FROM curricula c
             JOIN departments d ON c.department_id = d.id
             JOIN faculties f ON d.faculty_id = f.id
             ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json(paginatedResponse(curricula, total, page, limit));
    } catch (error) {
        console.error('Get curricula error:', error);
        res.status(500).json({ success: false, message: 'Error fetching curricula' });
    }
});

// GET single curriculum with all semesters and their courses
router.get('/:id', async (req, res) => {
    try {
        const [curricula] = await pool.query(
            `SELECT c.*, d.name as department_name, f.name as faculty_name
             FROM curricula c
             JOIN departments d ON c.department_id = d.id
             JOIN faculties f ON d.faculty_id = f.id
             WHERE c.id = ?`,
            [req.params.id]
        );

        if (curricula.length === 0) {
            return res.status(404).json({ success: false, message: 'Curriculum not found' });
        }

        // Get all semesters with their courses
        const [semesters] = await pool.query(
            `SELECT cs.id, cs.semester_number, cs.name
             FROM curriculum_semesters cs
             WHERE cs.curriculum_id = ?
             ORDER BY cs.semester_number`,
            [req.params.id]
        );

        for (const sem of semesters) {
            const [courses] = await pool.query(
                `SELECT csc.id as entry_id, co.id as course_id, co.title, co.code, co.credit_hours, 
                        co.description, csc.type, d.name as department_name
                 FROM curriculum_semester_courses csc
                 JOIN courses co ON csc.course_id = co.id
                 JOIN departments d ON co.department_id = d.id
                 WHERE csc.curriculum_semester_id = ?
                 ORDER BY csc.type, co.code`,
                [sem.id]
            );
            sem.courses = courses;
        }

        // Get batches assigned to this curriculum
        const [batches] = await pool.query(
            `SELECT b.id, b.name, b.status FROM batches b WHERE b.curriculum_id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: { ...curricula[0], semesters, assigned_batches: batches }
        });
    } catch (error) {
        console.error('Get curriculum error:', error);
        res.status(500).json({ success: false, message: 'Error fetching curriculum' });
    }
});

// POST create curriculum (auto-creates 8 empty semesters)
router.post('/', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { name, department_id, description, total_semesters } = req.body;

        let final_department_id = department_id;
        if (req.user.role === 'deptadmin') {
            final_department_id = req.user.department_id;
        }

        if (!name || !final_department_id) {
            return res.status(400).json({ success: false, message: 'name and department_id are required' });
        }

        const semCount = total_semesters || 8;

        const [result] = await conn.query(
            'INSERT INTO curricula (name, department_id, description, total_semesters) VALUES (?, ?, ?, ?)',
            [name, final_department_id, description || null, semCount]
        );
        const curriculumId = result.insertId;

        // Auto-create semesters
        for (let i = 1; i <= semCount; i++) {
            await conn.query(
                'INSERT INTO curriculum_semesters (curriculum_id, semester_number, name) VALUES (?, ?, ?)',
                [curriculumId, i, `Semester ${i}`]
            );
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: `Curriculum created with ${semCount} semesters`,
            data: { id: curriculumId, name }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Create curriculum error:', error);
        res.status(500).json({ success: false, message: 'Error creating curriculum' });
    } finally {
        conn.release();
    }
});

// PUT update curriculum
router.put('/:id', isAdmin, scopeCurriculum, async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const fields = [];
        const values = [];
        if (name) { fields.push('name = ?'); values.push(name); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (status) { fields.push('status = ?'); values.push(status); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        values.push(req.params.id);
        const [result] = await pool.query(`UPDATE curricula SET ${fields.join(', ')} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Curriculum not found' });
        }
        res.json({ success: true, message: 'Curriculum updated' });
    } catch (error) {
        console.error('Update curriculum error:', error);
        res.status(500).json({ success: false, message: 'Error updating curriculum' });
    }
});

// DELETE curriculum
router.delete('/:id', isAdmin, scopeCurriculum, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM curricula WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Curriculum not found' });
        }
        res.json({ success: true, message: 'Curriculum deleted' });
    } catch (error) {
        console.error('Delete curriculum error:', error);
        res.status(500).json({ success: false, message: 'Error deleting curriculum' });
    }
});

// ===================== SEMESTER COURSES =====================

// POST add course(s) to a curriculum semester
router.post('/:id/semesters/:semNum/courses', isAdmin, scopeCurriculum, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { course_id, course_ids, type } = req.body;
        const courseType = type || 'core';

        // Find the curriculum_semester row
        const [semesters] = await conn.query(
            'SELECT id FROM curriculum_semesters WHERE curriculum_id = ? AND semester_number = ?',
            [req.params.id, req.params.semNum]
        );

        if (semesters.length === 0) {
            return res.status(404).json({ success: false, message: 'Semester not found in this curriculum' });
        }
        const semesterId = semesters[0].id;

        // Support both single and bulk
        const ids = course_ids && Array.isArray(course_ids) ? course_ids : (course_id ? [course_id] : []);
        if (ids.length === 0) {
            return res.status(400).json({ success: false, message: 'course_id or course_ids array is required' });
        }

        const added = [];
        const errors = [];

        for (const cId of ids) {
            try {
                // Check if the course already exists in ANY semester of this curriculum
                const [existing] = await conn.query(
                    `SELECT csc.id, cs.semester_number FROM curriculum_semester_courses csc
                     JOIN curriculum_semesters cs ON csc.curriculum_semester_id = cs.id
                     WHERE cs.curriculum_id = ? AND csc.course_id = ?`,
                    [req.params.id, cId]
                );

                if (existing.length > 0) {
                    errors.push({ course_id: cId, error: `Already in Semester ${existing[0].semester_number}` });
                    continue;
                }

                await conn.query(
                    'INSERT INTO curriculum_semester_courses (curriculum_semester_id, course_id, type) VALUES (?, ?, ?)',
                    [semesterId, cId, courseType]
                );
                added.push(cId);
            } catch (err) {
                errors.push({ course_id: cId, error: err.message });
            }
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: `${added.length} course(s) added to semester ${req.params.semNum}`,
            data: { added, errors }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Add courses to semester error:', error);
        res.status(500).json({ success: false, message: 'Error adding courses' });
    } finally {
        conn.release();
    }
});

// DELETE remove a course from a curriculum semester
router.delete('/:id/semesters/:semNum/courses/:courseId', isAdmin, scopeCurriculum, async (req, res) => {
    try {
        const [semesters] = await pool.query(
            'SELECT id FROM curriculum_semesters WHERE curriculum_id = ? AND semester_number = ?',
            [req.params.id, req.params.semNum]
        );
        if (semesters.length === 0) {
            return res.status(404).json({ success: false, message: 'Semester not found' });
        }

        const [result] = await pool.query(
            'DELETE FROM curriculum_semester_courses WHERE curriculum_semester_id = ? AND course_id = ?',
            [semesters[0].id, req.params.courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not in this semester' });
        }
        res.json({ success: true, message: 'Course removed from semester' });
    } catch (error) {
        console.error('Remove course error:', error);
        res.status(500).json({ success: false, message: 'Error removing course' });
    }
});

export default router;
