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
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { course_assignment_id, type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status, mapped_clos, questions } = req.body;
        if (!course_assignment_id || !type || !title) {
            return res.status(400).json({ success: false, message: 'course_assignment_id, type, and title are required' });
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
        const { type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status, mapped_clos, questions } = req.body;
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

// POST import grades from Excel (supports question-level columns)
router.post('/:id/grades/import', upload.single('file'), async (req, res) => {
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
            `SELECT a.*, ca.course_assignment_id as ca_id FROM assessments a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             WHERE a.id = ?`, [req.params.id]
        );
        const assessment = assessmentRows.length > 0 ? assessmentRows[0] : null;

        // Get questions for this assessment
        const [questions] = await conn.query(
            `SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY question_number`,
            [req.params.id]
        );

        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);
        let imported = 0, skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Find the registration number column (try multiple possible names)
                const regNum = row['Registration Number'] || row['student_id_number'] || row['Reg No'] || row['registration_number'];
                if (!regNum) {
                    skipped++;
                    errors.push({ row: i + 2, error: 'Missing registration number' });
                    continue;
                }

                const [students] = await conn.query(
                    `SELECT s.id FROM students s
                     JOIN enrollments e ON s.id = e.student_id
                     WHERE s.student_id_number = ? AND e.course_assignment_id = ?`,
                    [regNum, assessment.course_assignment_id]
                );
                if (students.length === 0) {
                    skipped++;
                    errors.push({ row: i + 2, student: regNum, error: 'Student not found or not enrolled' });
                    continue;
                }
                const studentId = students[0].id;

                let totalScore = 0;
                let hasQuestionScores = false;

                if (questions.length > 0) {
                    // Process question-level scores
                    for (const q of questions) {
                        // Try to find the column for this question
                        const colKey = Object.keys(row).find(k => k.startsWith(`Q${q.question_number}`));
                        if (colKey !== undefined && row[colKey] !== '' && row[colKey] !== undefined) {
                            const qScore = parseFloat(row[colKey]);
                            if (!isNaN(qScore)) {
                                // Validate score range
                                if (qScore < 0 || qScore > parseFloat(q.max_marks)) {
                                    errors.push({ row: i + 2, student: regNum, error: `Q${q.question_number} score ${qScore} out of range (0-${q.max_marks})` });
                                    continue;
                                }
                                hasQuestionScores = true;
                                totalScore += qScore;

                                // Upsert question grade
                                await conn.query(
                                    `INSERT INTO question_grades (assessment_id, student_id, question_id, score)
                                     VALUES (?, ?, ?, ?)
                                     ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                                    [req.params.id, studentId, q.id, qScore]
                                );
                            }
                        }
                    }
                } else {
                    // No questions — look for total score column
                    const scoreKey = Object.keys(row).find(k => k.startsWith('Total Score') || k === 'score' || k === 'Score');
                    if (scoreKey && row[scoreKey] !== '' && row[scoreKey] !== undefined) {
                        totalScore = parseFloat(row[scoreKey]);
                        if (!isNaN(totalScore)) {
                            // Validate against assessment max_score
                            if (totalScore < 0 || (assessment && totalScore > parseFloat(assessment.max_score))) {
                                errors.push({ row: i + 2, student: regNum, error: `Total score ${totalScore} out of range (0-${assessment?.max_score})` });
                                totalScore = 0;
                            } else {
                                hasQuestionScores = true;
                            }
                        }
                    }
                }

                // Upsert total grade
                if (hasQuestionScores) {
                    const remarks = row['Remarks'] || row['remarks'] || null;
                    await conn.query(
                        `INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at)
                         VALUES (?, ?, ?, ?, ?, NOW())
                         ON DUPLICATE KEY UPDATE score = VALUES(score), remarks = VALUES(remarks), graded_by = VALUES(graded_by), graded_at = NOW()`,
                        [req.params.id, studentId, totalScore, remarks, req.user.id]
                    );
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
