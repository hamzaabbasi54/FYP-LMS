// ============================================
// File: backend/routes/assessmentRoutes.js
// Assessments & Grades CRUD + Excel Import/Export
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAuthenticated } from '../middleware/auth.js';
import { scopeFaculty } from '../middleware/facultyScope.js';
import { validateMagicBytes } from '../middleware/validateMagicBytes.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir, createExcelUpload } from '../utils/excel.js';
import { recalcCGPAForAssessment } from '../utils/cgpa.js';
import { cacheDelPattern } from '../config/redis.js';

const router = express.Router();
router.use(verifyToken);

const upload = createExcelUpload(multer);

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

            // Fetch question counts
            const [qCounts] = await pool.query(
                `SELECT assessment_id, COUNT(*) as question_count FROM assessment_questions WHERE assessment_id IN (?) GROUP BY assessment_id`,
                [assessmentIds]
            );
            const qMap = {};
            qCounts.forEach(q => { qMap[q.assessment_id] = q.question_count; });

            // Attach to assessments
            assessments.forEach(a => {
                a.mapped_clos = cloMap[a.id] || [];
                a.question_count = qMap[a.id] || 0;
            });
        }

        res.json(paginatedResponse(assessments, total, page, limit));
    } catch (error) {
        console.error('Get assessments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assessments' });
    }
});

// GET single assessment with grade summary and questions
router.get('/:id', async (req, res) => {
    try {
        const [assessments] = await pool.query(
            `SELECT a.*, c.title as course_title, c.code as course_code, ca.course_id
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

        // Fetch questions with CLO info
        const [questions] = await pool.query(
            `SELECT aq.*, c.title as clo_title, c.clo_number as clo_number
             FROM assessment_questions aq
             LEFT JOIN clos c ON aq.clo_id = c.id
             WHERE aq.assessment_id = ?
             ORDER BY aq.question_number`,
            [req.params.id]
        );

        res.json({ success: true, data: { ...assessments[0], grade_stats: stats[0], mapped_clos: mappings, questions } });
    } catch (error) {
        console.error('Get assessment error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assessment' });
    }
});

// POST create assessment
router.post('/', scopeFaculty('course_assignment', 'body', 'course_assignment_id'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { course_assignment_id, type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status, mapped_clos, questions } = req.body;
        if (!course_assignment_id || !type || !title) {
            return res.status(400).json({ success: false, message: 'course_assignment_id, type, and title are required' });
        }

        // FIX Issue #6: Validate that all CLO IDs belong to the correct course
        const allCloIdsToValidate = new Set();
        if (mapped_clos && Array.isArray(mapped_clos)) {
            mapped_clos.forEach(id => { if (id) allCloIdsToValidate.add(parseInt(id)); });
        }
        if (questions && Array.isArray(questions)) {
            questions.forEach(q => { if (q.clo_id) allCloIdsToValidate.add(parseInt(q.clo_id)); });
        }
        if (allCloIdsToValidate.size > 0) {
            const cloIdsArray = [...allCloIdsToValidate];
            const [validClos] = await conn.query(
                `SELECT DISTINCT c.id FROM clos c
                 LEFT JOIN course_clo_mapping ccm ON c.id = ccm.clo_id
                 WHERE c.id IN (?)
                   AND (c.course_id = (SELECT course_id FROM course_assignments WHERE id = ?)
                        OR ccm.course_id = (SELECT course_id FROM course_assignments WHERE id = ?))`,
                [cloIdsArray, course_assignment_id, course_assignment_id]
            );
            const validCloIds = new Set(validClos.map(c => c.id));
            const invalidClos = cloIdsArray.filter(id => !validCloIds.has(id));
            if (invalidClos.length > 0) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: `CLO ID(s) ${invalidClos.join(', ')} do not belong to this course. Please use CLOs mapped to this course only.`
                });
            }
        }

        // Auto-calculate max_score from questions if provided
        let finalMaxScore = max_score || 100;
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const sumMarks = questions.reduce((sum, q) => sum + (parseFloat(q.max_marks) || 0), 0);
            if (sumMarks > 0) finalMaxScore = sumMarks;
        }

        const [result] = await conn.query(
            `INSERT INTO assessments (course_assignment_id, type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [course_assignment_id, type, title, description || null, due_date || null, conducted_date || null, release_grades_on || null,
                finalMaxScore, weight || null, duration_minutes || null, status || 'draft']
        );

        const assessmentId = result.insertId;

        // Insert CLO mappings (assessment-level)
        if (mapped_clos && Array.isArray(mapped_clos) && mapped_clos.length > 0) {
            const mappingValues = mapped_clos.map(cloId => [assessmentId, cloId]);
            await conn.query('INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', [mappingValues]);
        }

        // Insert questions
        if (questions && Array.isArray(questions) && questions.length > 0) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                await conn.query(
                    `INSERT INTO assessment_questions (assessment_id, question_number, description, max_marks, weightage, clo_id)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [assessmentId, i + 1, q.description || null, q.max_marks || 10, q.weightage || null, q.clo_id || null]
                );
            }

            // Auto-collect unique CLOs from questions and add to assessment_clo_mapping
            const questionCloIds = [...new Set(questions.filter(q => q.clo_id).map(q => q.clo_id))];
            const existingClos = (mapped_clos || []).map(id => parseInt(id));
            const newClos = questionCloIds.filter(id => !existingClos.includes(parseInt(id)));
            if (newClos.length > 0) {
                const newMappingValues = newClos.map(cloId => [assessmentId, cloId]);
                await conn.query('INSERT IGNORE INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', [newMappingValues]);
            }
        }

        await conn.commit();
        await cacheDelPattern('obe:*');
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
router.put('/:id', scopeFaculty('assessment', 'params', 'id'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [[currentAssessment]] = await conn.query('SELECT status FROM assessments WHERE id = ?', [req.params.id]);
        if (!currentAssessment) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        if (currentAssessment.status === 'graded') {
            await conn.rollback();
            return res.status(403).json({ success: false, message: 'Cannot modify a graded assessment. Contact administrator to unlock.' });
        }

        const { type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status, mapped_clos, questions } = req.body;

        // FIX Issue #6: Validate that all CLO IDs belong to the correct course
        const allCloIdsToValidate = new Set();
        if (mapped_clos && Array.isArray(mapped_clos)) {
            mapped_clos.forEach(id => { if (id) allCloIdsToValidate.add(parseInt(id)); });
        }
        if (questions && Array.isArray(questions)) {
            questions.forEach(q => { if (q.clo_id) allCloIdsToValidate.add(parseInt(q.clo_id)); });
        }
        if (allCloIdsToValidate.size > 0) {
            // Get the course_assignment_id for this assessment
            const [[assessmentInfo]] = await conn.query(
                'SELECT course_assignment_id FROM assessments WHERE id = ?', [req.params.id]
            );
            if (assessmentInfo) {
                const cloIdsArray = [...allCloIdsToValidate];
                const [validClos] = await conn.query(
                    `SELECT DISTINCT c.id FROM clos c
                     LEFT JOIN course_clo_mapping ccm ON c.id = ccm.clo_id
                     WHERE c.id IN (?)
                       AND (c.course_id = (SELECT course_id FROM course_assignments WHERE id = ?)
                            OR ccm.course_id = (SELECT course_id FROM course_assignments WHERE id = ?))`,
                    [cloIdsArray, assessmentInfo.course_assignment_id, assessmentInfo.course_assignment_id]
                );
                const validCloIds = new Set(validClos.map(c => c.id));
                const invalidClos = cloIdsArray.filter(id => !validCloIds.has(id));
                if (invalidClos.length > 0) {
                    await conn.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `CLO ID(s) ${invalidClos.join(', ')} do not belong to this course. Please use CLOs mapped to this course only.`
                    });
                }
            }
        }

        const fields = [];
        const values = [];
        if (type) { fields.push('type = ?'); values.push(type); }
        if (title) { fields.push('title = ?'); values.push(title); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (due_date !== undefined) { fields.push('due_date = ?'); values.push(due_date); }
        if (conducted_date !== undefined) { fields.push('conducted_date = ?'); values.push(conducted_date); }
        if (release_grades_on !== undefined) { fields.push('release_grades_on = ?'); values.push(release_grades_on); }
        if (max_score) { fields.push('max_score = ?'); values.push(max_score); }
        if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
        if (duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(duration_minutes); }
        if (status) { fields.push('status = ?'); values.push(status); }

        // Auto-calculate max_score from questions if provided
        if (questions && Array.isArray(questions) && questions.length > 0) {
            const sumMarks = questions.reduce((sum, q) => sum + (parseFloat(q.max_marks) || 0), 0);
            if (sumMarks > 0) {
                fields.push('max_score = ?');
                values.push(sumMarks);
            }
        }

        if (fields.length > 0) {
            values.push(req.params.id);
            const [result] = await conn.query(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`, values);
            if (result.affectedRows === 0) {
                await conn.rollback();
                return res.status(404).json({ success: false, message: 'Assessment not found' });
            }
        }

        // Update questions (delete and re-insert) — reject if grades exist
        if (questions && Array.isArray(questions)) {
            const [[{ gradeCount }]] = await conn.query(
                'SELECT COUNT(*) as gradeCount FROM question_grades WHERE assessment_id = ?', [req.params.id]
            );
            if (gradeCount > 0) {
                await conn.rollback();
                return res.status(400).json({ success: false, message: 'Cannot modify questions: grades already exist for this assessment. Delete grades first.' });
            }
            await conn.query('DELETE FROM assessment_questions WHERE assessment_id = ?', [req.params.id]);
            if (questions.length > 0) {
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    await conn.query(
                        `INSERT INTO assessment_questions (assessment_id, question_number, description, max_marks, weightage, clo_id)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [req.params.id, i + 1, q.description || null, q.max_marks || 10, q.weightage || null, q.clo_id || null]
                    );
                }
            }
        }

        // Recompute CLO mappings from both mapped_clos and question clo_ids
        const allCloIds = new Set();
        if (mapped_clos && Array.isArray(mapped_clos)) {
            mapped_clos.forEach(id => { if (id) allCloIds.add(parseInt(id)); });
        }
        if (questions && Array.isArray(questions)) {
            questions.forEach(q => { if (q.clo_id) allCloIds.add(parseInt(q.clo_id)); });
        }
        if (mapped_clos || (questions && questions.some(q => q.clo_id))) {
            await conn.query('DELETE FROM assessment_clo_mapping WHERE assessment_id = ?', [req.params.id]);
            if (allCloIds.size > 0) {
                const mappingValues = [...allCloIds].map(cloId => [req.params.id, cloId]);
                await conn.query('INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', [mappingValues]);
            }
        }

        await conn.commit();
        await cacheDelPattern('obe:*');
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
router.delete('/:id', scopeFaculty('assessment', 'params', 'id'), async (req, res) => {
    try {
        const [[currentAssessment]] = await pool.query('SELECT status FROM assessments WHERE id = ?', [req.params.id]);
        if (!currentAssessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        if (currentAssessment.status === 'graded') {
            return res.status(403).json({ success: false, message: 'Cannot delete a graded assessment. Contact administrator to unlock.' });
        }

        const [result] = await pool.query('DELETE FROM assessments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        await cacheDelPattern('obe:*');
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

        // Fetch question grades for these students
        let questionGradesMap = {};
        if (grades.length > 0) {
            const studentIds = grades.map(g => g.student_id);
            const [qGrades] = await pool.query(
                `SELECT qg.student_id, qg.question_id, qg.score, aq.question_number
                 FROM question_grades qg
                 JOIN assessment_questions aq ON qg.question_id = aq.id
                 WHERE qg.assessment_id = ? AND qg.student_id IN (?)`,
                [req.params.id, studentIds]
            );

            qGrades.forEach(qg => {
                if (!questionGradesMap[qg.student_id]) {
                    questionGradesMap[qg.student_id] = {};
                }
                questionGradesMap[qg.student_id][`q${qg.question_number}`] = qg.score;
            });
        }

        // Attach question scores safely (default to empty object)
        const enrichedGrades = grades.map(g => ({
            ...g,
            question_scores: questionGradesMap[g.student_id] || {}
        }));

        res.json(paginatedResponse(enrichedGrades, total, page, limit));
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({ success: false, message: 'Error fetching grades' });
    }
});

// POST save grades (bulk upsert — optimized single-query batching)
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

        // Fetch assessment details for max_score validation
        const [[assessment]] = await conn.query(
            'SELECT max_score FROM assessments WHERE id = ?', [req.params.id]
        );
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Fetch questions to validate scores and map question_number to id
        const [questions] = await conn.query(
            'SELECT id, question_number, max_marks FROM assessment_questions WHERE assessment_id = ?',
            [req.params.id]
        );

        // Collect all question grade rows and total grade rows for bulk insert
        const questionGradeValues = [];
        const gradeValues = [];

        for (const grade of grades) {
            let finalScore = grade.score;

            if (grade.question_scores && questions.length > 0) {
                let computedScore = 0;
                for (const q of questions) {
                    const qScore = grade.question_scores[`q${q.question_number}`];
                    if (qScore !== undefined && qScore !== null && qScore !== '') {
                        const parsedScore = parseFloat(qScore);
                        if (!isNaN(parsedScore)) {
                            if (parsedScore < 0 || parsedScore > parseFloat(q.max_marks)) {
                                throw new Error(`Score for Question ${q.question_number} exceeds maximum allowed marks.`);
                            }
                            computedScore += parsedScore;
                            questionGradeValues.push([req.params.id, grade.student_id, q.id, parsedScore]);
                        }
                    }
                }
                finalScore = computedScore;
            } else {
                // Validate direct score input against assessment max_score
                const parsedScore = parseFloat(finalScore);
                if (!isNaN(parsedScore) && (parsedScore < 0 || parsedScore > parseFloat(assessment.max_score))) {
                    throw new Error(`Score ${parsedScore} exceeds maximum allowed (${assessment.max_score}).`);
                }
            }

            gradeValues.push([req.params.id, grade.student_id, finalScore, grade.remarks || null, req.user.id]);
        }

        // Bulk upsert question grades (single query instead of N queries)
        if (questionGradeValues.length > 0) {
            await conn.query(
                `INSERT INTO question_grades (assessment_id, student_id, question_id, score)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                [questionGradeValues]
            );
        }

        // Bulk upsert total grades (single query instead of N queries)
        if (gradeValues.length > 0) {
            await conn.query(
                `INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at)
                 VALUES ${gradeValues.map(() => '(?, ?, ?, ?, ?, NOW())').join(', ')}
                 ON DUPLICATE KEY UPDATE
                 score = VALUES(score), remarks = VALUES(remarks), graded_by = VALUES(graded_by), graded_at = NOW()`,
                gradeValues.flat()
            );
        }

        // Update assessment status to graded
        await conn.query(`UPDATE assessments SET status = 'graded' WHERE id = ?`, [req.params.id]);

        await conn.commit();
        await cacheDelPattern('obe:*');

        // Recalculate CGPA for all affected students (fire-and-forget)
        recalcCGPAForAssessment(req.params.id).catch(err => console.error('CGPA recalc error:', err.message));

        res.json({ success: true, message: `${grades.length} grades saved` });
    } catch (error) {
        await conn.rollback();
        console.error('Save grades error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error saving grades' });
    } finally {
        conn.release();
    }
});

// ===================== GRADES EXCEL TEMPLATE =====================

// GET download grading template for an assessment (with questions as columns)
router.get('/:id/grades/template', async (req, res) => {
    try {
        // Get assessment info with faculty ownership
        const [assessments] = await pool.query(
            `SELECT a.*, ca.course_id, ca.faculty_id FROM assessments a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             WHERE a.id = ?`, [req.params.id]
        );
        if (assessments.length === 0) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        const assessment = assessments[0];

        // Authorization check
        if (req.user.role === 'faculty' && assessment.faculty_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this template' });
        }

        // Get questions
        const [questions] = await pool.query(
            `SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY question_number`,
            [req.params.id]
        );

        // Get enrolled students
        const [students] = await pool.query(
            `SELECT s.id, s.student_id_number, s.first_name, s.last_name
             FROM students s
             JOIN enrollments e ON s.id = e.student_id
             WHERE e.course_assignment_id = ?
             ORDER BY s.last_name, s.first_name`,
            [assessment.course_assignment_id]
        );

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'No students enrolled' });
        }

        // Build template rows
        const templateRows = students.map(s => {
            const row = {
                'Registration Number': s.student_id_number,
                'Student Name': `${s.first_name} ${s.last_name}`
            };

            if (questions.length > 0) {
                // One column per question
                questions.forEach(q => {
                    row[`Q${q.question_number} (Max: ${q.max_marks})`] = '';
                });
            } else {
                // No questions defined, just a total score column
                row[`Total Score (Max: ${assessment.max_score})`] = '';
            }

            row['Remarks'] = '';
            return row;
        });

        const typeLabel = assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1);
        const buffer = generateExcel(templateRows, `${typeLabel} Grades`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${assessment.type}_${assessment.id}_template.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Download template error:', error);
        res.status(500).json({ success: false, message: 'Error generating template' });
    }
});

// ===================== GRADES EXCEL IMPORT (QUESTION-LEVEL) =====================

// POST import grades preview
router.post('/:id/grades/import-preview', upload.single('file'), validateMagicBytes, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Excel file required.' });
    }

    const conn = await pool.getConnection();
    try {
        // Validation and Authorization
        const [authCheck] = await conn.query(
            `SELECT ca.faculty_id 
             FROM assessments a 
             JOIN course_assignments ca ON a.course_assignment_id = ca.id 
             WHERE a.id = ?`, [req.params.id]
        );
        if (authCheck.length === 0) return res.status(404).json({ success: false, message: 'Assessment not found' });
        if (req.user.role === 'faculty' && authCheck[0].faculty_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const [assessmentRows] = await conn.query(
            `SELECT a.*, ca.id as ca_id FROM assessments a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             WHERE a.id = ?`, [req.params.id]
        );
        const assessment = assessmentRows[0];

        const [questions] = await conn.query(
            `SELECT aq.*, c.clo_number, c.title as clo_title 
             FROM assessment_questions aq 
             LEFT JOIN clos c ON aq.clo_id = c.id 
             WHERE aq.assessment_id = ? ORDER BY aq.question_number`, [req.params.id]
        );

        const rows = parseExcel(req.file.path);
        const previewData = [];
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const regNum = row['Registration Number'] || row['student_id_number'] || row['Reg No'] || row['registration_number'];
                if (!regNum) continue;

                const [students] = await conn.query(
                    `SELECT s.id, s.first_name, s.last_name FROM students s
                     JOIN enrollments e ON s.id = e.student_id
                     WHERE s.student_id_number = ? AND e.course_assignment_id = ?`,
                    [regNum, assessment.course_assignment_id]
                );

                if (students.length === 0) {
                    errors.push({ row: i + 2, student: regNum, error: 'Student not found or not enrolled' });
                    continue;
                }

                const student = students[0];
                let totalScore = 0;
                const cloAchievements = {}; // Track CLO performance for this student

                if (questions.length > 0) {
                    for (const q of questions) {
                        const colKey = Object.keys(row).find(k => k.startsWith(`Q${q.question_number}`));
                        if (colKey !== undefined && row[colKey] !== '' && row[colKey] !== undefined) {
                            const qScore = parseFloat(row[colKey]);
                            if (!isNaN(qScore) && qScore >= 0 && qScore <= parseFloat(q.max_marks)) {
                                totalScore += qScore;

                                // Calculate CLO % if question is mapped
                                if (q.clo_id) {
                                    if (!cloAchievements[q.clo_id]) {
                                        cloAchievements[q.clo_id] = { clo_number: q.clo_number, score: 0, max: 0 };
                                    }
                                    cloAchievements[q.clo_id].score += qScore;
                                    cloAchievements[q.clo_id].max += parseFloat(q.max_marks);
                                }
                            }
                        }
                    }
                } else {
                    const scoreKey = Object.keys(row).find(k => k.startsWith('Total Score') || k === 'score');
                    if (scoreKey && row[scoreKey] !== '' && row[scoreKey] !== undefined) {
                        totalScore = parseFloat(row[scoreKey]);
                    }
                }

                // Format CLO achievements for preview
                const formattedCLOs = Object.values(cloAchievements).map(c => ({
                    clo_number: c.clo_number,
                    percentage: Math.round((c.score / c.max) * 100)
                }));

                previewData.push({
                    student_id_number: regNum,
                    student_name: `${student.first_name} ${student.last_name}`,
                    total_score: totalScore,
                    max_score: assessment.max_score,
                    clos: formattedCLOs,
                    remarks: row['Remarks'] || ''
                });

            } catch (err) {
                errors.push({ row: i + 2, error: err.message });
            }
        }

        res.json({
            success: true,
            data: { preview: previewData, errors: errors.slice(0, 10) }
        });
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ success: false, message: 'Error generating preview' });
    } finally {
        conn.release();
    }
});

// POST import grades
router.post('/:id/grades/import', upload.single('file'), validateMagicBytes, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Excel file required.',
            expected_columns: ['Registration Number', 'Student Name', 'Q1', 'Q2', '...', 'Remarks']
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

        // Get assessment details for validation
        const [assessmentRows] = await conn.query(
            `SELECT a.*, ca.id as ca_id FROM assessments a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             WHERE a.id = ?`, [req.params.id]
        );
        const assessment = assessmentRows.length > 0 ? assessmentRows[0] : null;

        // Get questions for this assessment
        const [questions] = await conn.query(
            `SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY question_number`,
            [req.params.id]
        );

        // Pre-fetch ALL enrolled students for this course assignment in one query
        const [enrolledStudents] = await conn.query(
            `SELECT s.id, s.student_id_number FROM students s
             JOIN enrollments e ON s.id = e.student_id
             WHERE e.course_assignment_id = ?`,
            [assessment.course_assignment_id]
        );
        const studentMap = {};
        enrolledStudents.forEach(s => { studentMap[String(s.student_id_number).trim()] = s.id; });

        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);
        let imported = 0, skipped = 0;
        const errors = [];

        // Collect bulk insert data
        const questionGradeValues = [];
        const gradeValues = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const regNum = row['Registration Number'] || row['student_id_number'] || row['Reg No'] || row['registration_number'];
                if (!regNum) {
                    skipped++;
                    errors.push({ row: i + 2, error: 'Missing registration number' });
                    continue;
                }

                // Use pre-fetched map instead of per-row DB query
                const studentId = studentMap[String(regNum).trim()];
                if (!studentId) {
                    skipped++;
                    errors.push({ row: i + 2, student: regNum, error: 'Student not found or not enrolled' });
                    continue;
                }

                let totalScore = 0;
                let hasQuestionScores = false;

                if (questions.length > 0) {
                    for (const q of questions) {
                        const colKey = Object.keys(row).find(k => k.startsWith(`Q${q.question_number}`));
                        if (colKey !== undefined && row[colKey] !== '' && row[colKey] !== undefined) {
                            const qScore = parseFloat(row[colKey]);
                            if (!isNaN(qScore)) {
                                if (qScore < 0 || qScore > parseFloat(q.max_marks)) {
                                    errors.push({ row: i + 2, student: regNum, error: `Q${q.question_number} score ${qScore} out of range (0-${q.max_marks})` });
                                    continue;
                                }
                                hasQuestionScores = true;
                                totalScore += qScore;
                                questionGradeValues.push([req.params.id, studentId, q.id, qScore]);
                            }
                        }
                    }
                } else {
                    const scoreKey = Object.keys(row).find(k => k.startsWith('Total Score') || k === 'score' || k === 'Score');
                    if (scoreKey && row[scoreKey] !== '' && row[scoreKey] !== undefined) {
                        totalScore = parseFloat(row[scoreKey]);
                        if (!isNaN(totalScore)) {
                            if (totalScore < 0 || (assessment && totalScore > parseFloat(assessment.max_score))) {
                                errors.push({ row: i + 2, student: regNum, error: `Total score ${totalScore} out of range (0-${assessment?.max_score})` });
                                totalScore = 0;
                            } else {
                                hasQuestionScores = true;
                            }
                        }
                    }
                }

                if (hasQuestionScores) {
                    const remarks = row['Remarks'] || row['remarks'] || null;
                    gradeValues.push([req.params.id, studentId, totalScore, remarks, req.user.id]);
                    imported++;
                } else {
                    skipped++;
                    errors.push({ row: i + 2, student: regNum, error: 'No scores found' });
                }
            } catch (err) {
                skipped++;
                errors.push({ row: i + 2, error: err.message });
            }
        }

        // Bulk upsert question grades
        if (questionGradeValues.length > 0) {
            await conn.query(
                `INSERT INTO question_grades (assessment_id, student_id, question_id, score)
                 VALUES ?
                 ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                [questionGradeValues]
            );
        }

        // Bulk upsert total grades
        if (gradeValues.length > 0) {
            await conn.query(
                `INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at)
                 VALUES ${gradeValues.map(() => '(?, ?, ?, ?, ?, NOW())').join(', ')}
                 ON DUPLICATE KEY UPDATE score = VALUES(score), remarks = VALUES(remarks), graded_by = VALUES(graded_by), graded_at = NOW()`,
                gradeValues.flat()
            );
        }

        await conn.commit();
        await cacheDelPattern('obe:*');

        // Recalculate CGPA for all affected students (fire-and-forget)
        recalcCGPAForAssessment(req.params.id).catch(err => console.error('CGPA recalc error:', err.message));

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
