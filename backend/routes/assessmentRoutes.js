// ============================================
// File: backend/routes/assessmentRoutes.js
// Assessments & Grades CRUD + Excel Import/Export
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAuthenticated } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir } from '../utils/excel.js';

const router = express.Router();
router.use(verifyToken);

const upload = multer({ dest: getUploadDir() });

// ===================== ASSESSMENTS =====================

// GET assessments for a course assignment (paginated)
router.get('/course/:courseAssignmentId', async (req, res) => {
    try {
        const { type, status } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        let whereClause = 'WHERE course_assignment_id = ?';
        const params = [req.params.courseAssignmentId];
        if (type) { whereClause += ' AND type = ?'; params.push(type); }
        if (status) { whereClause += ' AND status = ?'; params.push(status); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM assessments ${whereClause}`, params
        );

        const [assessments] = await pool.query(
            `SELECT * FROM assessments ${whereClause} ORDER BY due_date ASC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Fetch mapped CLOs for these assessments
        if (assessments.length > 0) {
            const assessmentIds = assessments.map(a => a.id);
            const [mappings] = await pool.query(
                `SELECT m.assessment_id, c.id, c.clo_number, c.title
                 FROM assessment_clo_mapping m
                 JOIN clos c ON m.clo_id = c.id
                 WHERE m.assessment_id IN (?)`,
                [assessmentIds]
            );

            // Group mappings by assessment_id
            const cloMap = {};
            mappings.forEach(m => {
                if (!cloMap[m.assessment_id]) cloMap[m.assessment_id] = [];
                cloMap[m.assessment_id].push({ id: m.id, clo_number: m.clo_number, title: m.title });
            });

            // Attach to assessments
            assessments.forEach(a => {
                a.mapped_clos = cloMap[a.id] || [];
            });
        }

        res.json(paginatedResponse(assessments, total, page, limit));
    } catch (error) {
        console.error('Get assessments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assessments' });
    }
});

// GET single assessment with grade summary
router.get('/:id', async (req, res) => {
    try {
        const [assessments] = await pool.query(
            `SELECT a.*, c.title as course_title, c.code as course_code
             FROM assessments a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             JOIN courses c ON ca.course_id = c.id
             WHERE a.id = ?`,
            [req.params.id]
        );
        if (assessments.length === 0) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        const [stats] = await pool.query(
            `SELECT COUNT(*) as graded_count, AVG(score) as avg_score,
                    MAX(score) as max_score, MIN(score) as min_score
             FROM grades WHERE assessment_id = ? AND score IS NOT NULL`,
            [req.params.id]
        );

        const [mappings] = await pool.query(
            `SELECT c.id, c.clo_number, c.title
             FROM assessment_clo_mapping m
             JOIN clos c ON m.clo_id = c.id
             WHERE m.assessment_id = ?`,
            [req.params.id]
        );

        res.json({ success: true, data: { ...assessments[0], grade_stats: stats[0], mapped_clos: mappings } });
    } catch (error) {
        console.error('Get assessment error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assessment' });
    }
});

// POST create assessment
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { course_assignment_id, type, title, description, due_date, release_grades_on, max_score, weight, duration_minutes, status, mapped_clos } = req.body;
        if (!course_assignment_id || !type || !title) {
            return res.status(400).json({ success: false, message: 'course_assignment_id, type, and title are required' });
        }
        
        const [result] = await conn.query(
            `INSERT INTO assessments (course_assignment_id, type, title, description, due_date, release_grades_on, max_score, weight, duration_minutes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [course_assignment_id, type, title, description || null, due_date || null, release_grades_on || null,
             max_score || 100, weight || null, duration_minutes || null, status || 'draft']
        );
        
        const assessmentId = result.insertId;

        if (mapped_clos && Array.isArray(mapped_clos) && mapped_clos.length > 0) {
            const mappingValues = mapped_clos.map(cloId => [assessmentId, cloId]);
            await conn.query('INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', [mappingValues]);
        }

        await conn.commit();
        res.status(201).json({ success: true, message: 'Assessment created', data: { id: assessmentId, title, type } });
    } catch (error) {
        await conn.rollback();
        console.error('Create assessment error:', error);
        res.status(500).json({ success: false, message: 'Error creating assessment' });
    } finally {
        conn.release();
    }
});

// PUT update assessment
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { type, title, description, due_date, release_grades_on, max_score, weight, duration_minutes, status, mapped_clos } = req.body;
        const fields = [];
        const values = [];
        if (type) { fields.push('type = ?'); values.push(type); }
        if (title) { fields.push('title = ?'); values.push(title); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }
        if (release_grades_on !== undefined) { fields.push('release_grades_on = ?'); values.push(release_grades_on); }
        if (max_score) { fields.push('max_score = ?'); values.push(max_score); }
        if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
        if (duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(duration_minutes); }
        if (status) { fields.push('status = ?'); values.push(status); }
        
        if (fields.length > 0) {
            values.push(req.params.id);
            const [result] = await conn.query(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`, values);
            if (result.affectedRows === 0) {
                await conn.rollback();
                return res.status(404).json({ success: false, message: 'Assessment not found' });
            }
        }

        if (mapped_clos && Array.isArray(mapped_clos)) {
            await conn.query('DELETE FROM assessment_clo_mapping WHERE assessment_id = ?', [req.params.id]);
            if (mapped_clos.length > 0) {
                const mappingValues = mapped_clos.map(cloId => [req.params.id, cloId]);
                await conn.query('INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', [mappingValues]);
            }
        }

        await conn.commit();
        res.json({ success: true, message: 'Assessment updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Update assessment error:', error);
        res.status(500).json({ success: false, message: 'Error updating assessment' });
    } finally {
        conn.release();
    }
});

// DELETE assessment
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM assessments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        res.json({ success: true, message: 'Assessment deleted' });
    } catch (error) {
        console.error('Delete assessment error:', error);
        res.status(500).json({ success: false, message: 'Error deleting assessment' });
    }
});

// ===================== GRADES =====================

// GET all grades for an assessment (paginated)
router.get('/:id/grades', async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM grades WHERE assessment_id = ?', [req.params.id]
        );

        const [grades] = await pool.query(
            `SELECT g.*, s.first_name, s.last_name, s.student_id_number, s.email,
                    u.full_name as grader_name
             FROM grades g
             JOIN students s ON g.student_id = s.id
             LEFT JOIN users u ON g.graded_by = u.id
             WHERE g.assessment_id = ?
             ORDER BY s.last_name, s.first_name
             LIMIT ? OFFSET ?`,
            [req.params.id, limit, offset]
        );

        res.json(paginatedResponse(grades, total, page, limit));
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({ success: false, message: 'Error fetching grades' });
    }
});

// POST save grades (bulk upsert)
router.post('/:id/grades', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        // Ownership check
        const [authCheck] = await conn.query(
            `SELECT ca.faculty_id 
             FROM assessments a 
             JOIN course_assignments ca ON a.course_assignment_id = ca.id 
             WHERE a.id = ?`,
            [req.params.id]
        );

        if (authCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        if (req.user.role === 'faculty' && authCheck[0].faculty_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to grade this assessment' });
        }

        await conn.beginTransaction();
        const { grades } = req.body;
        if (!grades || !Array.isArray(grades)) {
            return res.status(400).json({ success: false, message: 'grades array is required' });
        }

        for (const grade of grades) {
            await conn.query(
                `INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at)
                 VALUES (?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE
                 score = VALUES(score), remarks = VALUES(remarks), graded_by = VALUES(graded_by), graded_at = NOW()`,
                [req.params.id, grade.student_id, grade.score, grade.remarks || null, req.user.id]
            );
        }

        await conn.commit();
        res.json({ success: true, message: `${grades.length} grades saved` });
    } catch (error) {
        await conn.rollback();
        console.error('Save grades error:', error);
        res.status(500).json({ success: false, message: 'Error saving grades' });
    } finally {
        conn.release();
    }
});

// ===================== GRADES EXCEL IMPORT =====================

// POST import grades from Excel
router.post('/:id/grades/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Excel file required.',
            expected_columns: ['student_id_number', 'score', 'remarks']
        });
    }

    const conn = await pool.getConnection();
    try {
        // Ownership check
        const [authCheck] = await conn.query(
            `SELECT ca.faculty_id 
             FROM assessments a 
             JOIN course_assignments ca ON a.course_assignment_id = ca.id 
             WHERE a.id = ?`,
            [req.params.id]
        );

        if (authCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        if (req.user.role === 'faculty' && authCheck[0].faculty_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to grade this assessment' });
        }

        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);
        let imported = 0, skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const [students] = await conn.query(
                    'SELECT id FROM students WHERE student_id_number = ?', [row.student_id_number]
                );
                if (students.length === 0) {
                    skipped++;
                    errors.push({ row: i + 2, student: row.student_id_number, error: 'Student not found' });
                    continue;
                }

                await conn.query(
                    `INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at)
                     VALUES (?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE score = VALUES(score), remarks = VALUES(remarks), graded_by = VALUES(graded_by), graded_at = NOW()`,
                    [req.params.id, students[0].id, row.score, row.remarks || null, req.user.id]
                );
                imported++;
            } catch (err) {
                skipped++;
                errors.push({ row: i + 2, error: err.message });
            }
        }

        await conn.commit();
        res.json({
            success: true,
            message: `Grades import: ${imported} saved, ${skipped} skipped`,
            data: { imported, skipped, errors: errors.slice(0, 20) }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Import grades error:', error);
        res.status(500).json({ success: false, message: 'Error importing grades' });
    } finally {
        conn.release();
    }
});

// ===================== GRADES EXCEL EXPORT =====================

// GET export grades as Excel
router.get('/:id/grades/export', async (req, res) => {
    try {
        const [grades] = await pool.query(
            `SELECT s.student_id_number, s.first_name, s.last_name, s.email,
                    g.score, a.max_score,
                    ROUND((g.score / a.max_score * 100), 2) as percentage,
                    g.remarks, u.full_name as graded_by, g.graded_at
             FROM grades g
             JOIN students s ON g.student_id = s.id
             JOIN assessments a ON g.assessment_id = a.id
             LEFT JOIN users u ON g.graded_by = u.id
             WHERE g.assessment_id = ?
             ORDER BY s.last_name`,
            [req.params.id]
        );

        if (grades.length === 0) {
            return res.status(404).json({ success: false, message: 'No grades to export' });
        }

        const buffer = generateExcel(grades, 'Grades');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=grades_export.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export grades error:', error);
        res.status(500).json({ success: false, message: 'Error exporting grades' });
    }
});

export default router;
