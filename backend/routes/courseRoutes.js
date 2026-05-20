// ============================================
// File: backend/routes/courseRoutes.js
// Courses, CLOs, Syllabi CRUD Routes
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAdmin, isAuthenticated } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir } from '../utils/excel.js';

const router = express.Router();
router.use(verifyToken);

const upload = multer({ dest: getUploadDir() });

// ===================== COURSES =====================

// GET all courses (paginated, with department name)
router.get('/', async (req, res) => {
    try {
        const { department_id, search } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        let whereClause = 'WHERE 1=1';
        const params = [];
        if (department_id) { whereClause += ' AND c.department_id = ?'; params.push(department_id); }
        if (search) {
            whereClause += ' AND (c.title LIKE ? OR c.code LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM courses c ${whereClause}`, params
        );

        const [courses] = await pool.query(
            `SELECT c.*, d.name as department_name
             FROM courses c
             JOIN departments d ON c.department_id = d.id
             ${whereClause}
             ORDER BY c.code
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json(paginatedResponse(courses, total, page, limit));
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ success: false, message: 'Error fetching courses' });
    }
});

// GET all courses as a simple list (for picker/popup, no pagination)
router.get('/all-list', async (req, res) => {
    try {
        const [courses] = await pool.query(
            `SELECT c.id, c.title, c.code, c.credit_hours, d.name as department_name
             FROM courses c JOIN departments d ON c.department_id = d.id ORDER BY c.code`
        );
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Get all-list error:', error);
        res.status(500).json({ success: false, message: 'Error fetching course list' });
    }
});

// ===================== CLO MANAGEMENT (GLOBAL) =====================

// GET all CLOs (standalone, with mapped courses and PLOs)
router.get('/clos/all', async (req, res) => {
    try {
        const [clos] = await pool.query(
            `SELECT cl.id, cl.clo_number, cl.title, cl.description, cl.cognitive_level
             FROM clos cl ORDER BY cl.title, cl.clo_number`
        );
        for (const clo of clos) {
            // Get mapped courses from junction table
            const [courses] = await pool.query(
                `SELECT c.id, c.title, c.code FROM course_clo_mapping ccm
                 JOIN courses c ON ccm.course_id = c.id
                 WHERE ccm.clo_id = ?`, [clo.id]
            );
            clo.mapped_courses = courses;
            // Get mapped PLOs
            const [plos] = await pool.query(
                `SELECT p.id, p.plo_number, p.description
                 FROM clo_plo_mapping cpm
                 JOIN plos p ON cpm.plo_id = p.id
                 WHERE cpm.clo_id = ?`, [clo.id]
            );
            clo.mapped_plos = plos;
        }
        res.json({ success: true, data: clos });
    } catch (error) {
        console.error('Get all CLOs error:', error);
        res.status(500).json({ success: false, message: 'Error fetching CLOs' });
    }
});

// POST add individual CLO (standalone, no course required)
router.post('/clos/add', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { title, description, cognitive_level } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: 'CLO title is required' });
        }
        const cloPattern = /^CLO-\d+$/;
        if (!cloPattern.test(title)) {
            return res.status(400).json({ success: false, message: 'CLO title must be in CLO-X format (e.g. CLO-1, CLO-2)' });
        }
        const cloNumber = parseInt(title.split('-')[1]);
        const [result] = await conn.query(
            'INSERT INTO clos (course_id, clo_number, title, description, cognitive_level) VALUES (NULL, ?, ?, ?, ?)',
            [cloNumber, title, description || null, cognitive_level || null]
        );
        await conn.commit();
        res.status(201).json({ success: true, message: 'CLO added', data: { id: result.insertId } });
    } catch (error) {
        await conn.rollback();
        console.error('Add CLO error:', error);
        res.status(500).json({ success: false, message: 'Error adding CLO' });
    } finally {
        conn.release();
    }
});

// POST import CLOs from Excel
router.post('/clos/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);
        let imported = 0, skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Expect: course_code, clo_number, title, description, cognitive_level
                if (!row.course_code || !row.clo_number) {
                    skipped++;
                    errors.push({ row: i + 2, error: 'Missing course_code or clo_number' });
                    continue;
                }
                const [[course]] = await conn.query('SELECT id FROM courses WHERE code = ?', [row.course_code.toUpperCase()]);
                if (!course) {
                    skipped++;
                    errors.push({ row: i + 2, error: `Course ${row.course_code} not found` });
                    continue;
                }
                const cloNum = parseInt(row.clo_number);
                const title = `CLO-${cloNum}`;
                await conn.query(
                    `INSERT INTO clos (course_id, clo_number, title, description, cognitive_level)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), cognitive_level = VALUES(cognitive_level)`,
                    [course.id, cloNum, title, row.description || null, row.cognitive_level || null]
                );
                imported++;
            } catch (err) {
                skipped++;
                errors.push({ row: i + 2, error: err.message });
            }
        }
        await conn.commit();
        res.json({ success: true, message: `CLO import: ${imported} saved, ${skipped} skipped`, data: { imported, skipped, errors: errors.slice(0, 20) } });
    } catch (error) {
        await conn.rollback();
        console.error('Import CLOs error:', error);
        res.status(500).json({ success: false, message: 'Error importing CLOs' });
    } finally {
        conn.release();
    }
});

// GET export CLOs as Excel
router.get('/clos/export', async (req, res) => {
    try {
        const [clos] = await pool.query(
            `SELECT c.code as course_code, cl.clo_number, cl.title, cl.description, cl.cognitive_level
             FROM clos cl JOIN courses c ON cl.course_id = c.id
             ORDER BY c.code, cl.clo_number`
        );
        if (clos.length === 0) {
            return res.status(404).json({ success: false, message: 'No CLOs to export' });
        }
        const buffer = generateExcel(clos, 'CLOs');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=clos_export.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export CLOs error:', error);
        res.status(500).json({ success: false, message: 'Error exporting CLOs' });
    }
});

// ===================== EXCEL IMPORT / EXPORT =====================


// POST import courses from Excel
router.post('/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Excel file required.',
            expected_columns: ['title', 'code', 'department_name', 'credit_hours', 'prerequisites', 'description']
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);
        let imported = 0, skipped = 0;
        const errors = [];

        // Pre-fetch all departments to match names to IDs
        const [departments] = await conn.query('SELECT id, name FROM departments');
        const deptMap = {};
        departments.forEach(d => {
            deptMap[d.name.toLowerCase()] = d.id;
        });

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                if (!row.title || !row.code || !row.department_name || !row.credit_hours) {
                    throw new Error('Missing required fields (title, code, department_name, credit_hours)');
                }

                const deptNameLower = String(row.department_name).trim().toLowerCase();
                const departmentId = deptMap[deptNameLower];

                if (!departmentId) {
                    throw new Error(`Department '${row.department_name}' not found in database`);
                }

                await conn.query(
                    `INSERT INTO courses (title, code, department_id, credit_hours, prerequisites, description)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     title = VALUES(title), department_id = VALUES(department_id), 
                     credit_hours = VALUES(credit_hours), prerequisites = VALUES(prerequisites), 
                     description = VALUES(description)`,
                    [
                        row.title, 
                        row.code, 
                        departmentId, 
                        parseInt(row.credit_hours) || 3, 
                        row.prerequisites || '', 
                        row.description || ''
                    ]
                );
                imported++;
            } catch (err) {
                skipped++;
                errors.push({ row: i + 2, code: row.code, error: err.message });
            }
        }

        await conn.commit();
        res.json({
            success: true,
            message: `Courses import: ${imported} saved, ${skipped} skipped`,
            data: { imported, skipped, errors: errors.slice(0, 20) }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Import courses error:', error);
        res.status(500).json({ success: false, message: 'Error importing courses' });
    } finally {
        conn.release();
    }
});

// GET export courses as Excel
router.get('/export', async (req, res) => {
    try {
        const [courses] = await pool.query(
            `SELECT c.title, c.code, d.name as department_name, c.credit_hours, c.prerequisites, c.description
             FROM courses c
             JOIN departments d ON c.department_id = d.id
             ORDER BY d.name, c.code`
        );

        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: 'No courses to export' });
        }

        const buffer = generateExcel(courses, 'Courses');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=courses_export.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export courses error:', error);
        res.status(500).json({ success: false, message: 'Error exporting courses' });
    }
});

// =================================================================


// GET courses assigned to logged in faculty
router.get('/assigned', async (req, res) => {
    try {
        const [assignments] = await pool.query(
            `SELECT ca.id as assignment_id, c.id as course_id, c.title, c.code, c.credit_hours,
                    s.id as semester_id, s.name as semester_name,
                    b.id as batch_id, b.name as batch_name, b.start_date, b.end_date,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_assignment_id = ca.id) as student_count
             FROM course_assignments ca
             JOIN courses c ON ca.course_id = c.id
             JOIN semesters s ON ca.semester_id = s.id
             JOIN batches b ON s.batch_id = b.id
             WHERE ca.faculty_id = ?
             ORDER BY b.start_date DESC, s.name DESC, c.code ASC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Get assigned courses error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assigned courses' });
    }
});

// GET all course assignments (admin view)
router.get('/assignments', isAdmin, async (req, res) => {
    try {
        const [assignments] = await pool.query(
            `SELECT ca.id as assignment_id, c.id as course_id, c.title, c.code, c.credit_hours,
                    s.id as semester_id, s.name as semester_name,
                    b.id as batch_id, b.name as batch_name, b.start_date, b.end_date,
                    u.id as faculty_id, u.full_name as faculty_name,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_assignment_id = ca.id) as student_count
             FROM course_assignments ca
             JOIN courses c ON ca.course_id = c.id
             JOIN semesters s ON ca.semester_id = s.id
             JOIN batches b ON s.batch_id = b.id
             LEFT JOIN users u ON ca.faculty_id = u.id
             ORDER BY b.start_date DESC, s.name ASC, c.title ASC`
        );
        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Get all assignments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assignments' });
    }
});

// GET CLOs for a specific course (for assessment question CLO dropdown)
router.get('/:id/clos-for-assessment', async (req, res) => {
    try {
        const [clos] = await pool.query(
            `SELECT c.id, c.clo_number, c.title, c.description
             FROM clos c
             WHERE c.course_id = ?
             ORDER BY c.clo_number`,
            [req.params.id]
        );

        // Also get CLOs mapped via the junction table (course_clo_mapping)
        const [mappedClos] = await pool.query(
            `SELECT c.id, c.clo_number, c.title, c.description
             FROM course_clo_mapping ccm
             JOIN clos c ON ccm.clo_id = c.id
             WHERE ccm.course_id = ?
             ORDER BY c.clo_number`,
            [req.params.id]
        );

        // Merge and deduplicate
        const allClos = [...clos, ...mappedClos];
        const uniqueClos = [];
        const seen = new Set();
        allClos.forEach(clo => {
            if (!seen.has(clo.id)) {
                seen.add(clo.id);
                uniqueClos.push(clo);
            }
        });

        res.json({ success: true, data: uniqueClos });
    } catch (error) {
        console.error('Get CLOs for assessment error:', error);
        res.status(500).json({ success: false, message: 'Error fetching CLOs' });
    }
});

// GET single course with CLOs and syllabus
router.get('/:id', async (req, res) => {

    try {
        const [courses] = await pool.query(
            `SELECT c.*, d.name as department_name
             FROM courses c
             JOIN departments d ON c.department_id = d.id
             WHERE c.id = ?`,
            [req.params.id]
        );
        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const [clos] = await pool.query(
            `SELECT c.*, 
                    COALESCE((SELECT JSON_ARRAYAGG(plo_id) FROM clo_plo_mapping WHERE clo_id = c.id), '[]') as mapped_plos
             FROM clos c WHERE c.course_id = ? ORDER BY c.clo_number`, [req.params.id]
        );
        
        clos.forEach(clo => {
            if (typeof clo.mapped_plos === 'string') {
                try {
                    clo.mapped_plos = JSON.parse(clo.mapped_plos);
                } catch(e) {
                    clo.mapped_plos = [];
                }
            }
        });
        const [syllabi] = await pool.query(
            'SELECT * FROM syllabi WHERE course_id = ?', [req.params.id]
        );

        // Fetch prerequisite courses
        const [prereqs] = await pool.query(
            `SELECT c.id, c.title, c.code FROM course_prerequisites cp
             JOIN courses c ON cp.prerequisite_course_id = c.id
             WHERE cp.course_id = ?`, [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...courses[0],
                clos,
                syllabus: syllabi.length > 0 ? syllabi[0] : null,
                prerequisite_courses: prereqs
            }
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ success: false, message: 'Error fetching course' });
    }
});

// POST create course with CLOs
router.post('/', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { title, code, department_id, credit_hours, semester_level, prerequisites, description, clos, prerequisite_ids } = req.body;

        if (!title || !code || !department_id || !credit_hours) {
            return res.status(400).json({ success: false, message: 'title, code, department_id, credit_hours are required' });
        }

        // Build prereq display string from IDs if provided
        let prereqDisplay = prerequisites || '';
        if (prerequisite_ids && Array.isArray(prerequisite_ids) && prerequisite_ids.length > 0) {
            const [prereqCourses] = await conn.query('SELECT code FROM courses WHERE id IN (?)', [prerequisite_ids]);
            prereqDisplay = prereqCourses.map(c => c.code).join(', ');
        }

        const [result] = await conn.query(
            `INSERT INTO courses (title, code, department_id, credit_hours, semester_level, prerequisites, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, code.toUpperCase(), department_id, credit_hours, semester_level || null, prereqDisplay, description || null]
        );
        const courseId = result.insertId;

        // Insert prerequisites into junction table
        if (prerequisite_ids && Array.isArray(prerequisite_ids) && prerequisite_ids.length > 0) {
            const prereqValues = prerequisite_ids.map(pid => [courseId, pid]);
            await conn.query('INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES ?', [prereqValues]);
        }

        // Map CLOs to course via junction table (clo_ids from picker)
        const { clo_ids } = req.body;
        if (clo_ids && Array.isArray(clo_ids) && clo_ids.length > 0) {
            const cloValues = clo_ids.map(cloId => [courseId, cloId]);
            await conn.query('INSERT INTO course_clo_mapping (course_id, clo_id) VALUES ?', [cloValues]);
        }

        // Insert new CLOs if provided (backward compat)
        if (clos && Array.isArray(clos) && clos.length > 0 && (!clo_ids || clo_ids.length === 0)) {
            for (let i = 0; i < clos.length; i++) {
                const clo = clos[i];
                const [cloResult] = await conn.query(
                    'INSERT INTO clos (course_id, clo_number, title, description, cognitive_level) VALUES (?, ?, ?, ?, ?)',
                    [courseId, i + 1, clo.title, clo.description || null, clo.cognitive_level || null]
                );
                // Also create mapping
                await conn.query('INSERT INTO course_clo_mapping (course_id, clo_id) VALUES (?, ?)', [courseId, cloResult.insertId]);
                
                if (clo.mapped_plos && Array.isArray(clo.mapped_plos) && clo.mapped_plos.length > 0) {
                    const cloId = cloResult.insertId;
                    const mappingValues = clo.mapped_plos.map(ploId => [cloId, ploId]);
                    await conn.query(
                        'INSERT INTO clo_plo_mapping (clo_id, plo_id) VALUES ?',
                        [mappingValues]
                    );
                }
            }
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: 'Course created',
            data: { id: courseId, title, code: code.toUpperCase() }
        });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Course code already exists' });
        }
        console.error('Create course error:', error);
        res.status(500).json({ success: false, message: 'Error creating course' });
    } finally {
        conn.release();
    }
});

// PUT update course
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { title, code, department_id, credit_hours, semester_level, prerequisites, description } = req.body;
        const fields = [];
        const values = [];
        if (title) { fields.push('title = ?'); values.push(title); }
        if (code) { fields.push('code = ?'); values.push(code.toUpperCase()); }
        if (department_id) { fields.push('department_id = ?'); values.push(department_id); }
        if (credit_hours) { fields.push('credit_hours = ?'); values.push(credit_hours); }
        if (semester_level !== undefined) { fields.push('semester_level = ?'); values.push(semester_level); }
        if (prerequisites !== undefined) { fields.push('prerequisites = ?'); values.push(prerequisites); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        values.push(req.params.id);
        const [result] = await pool.query(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, message: 'Course updated' });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: 'Error updating course' });
    }
});

// DELETE course
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, message: 'Course deleted' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ success: false, message: 'Error deleting course' });
    }
});

// ===================== CLOS =====================

// PUT update CLOs for a course (replace all)
router.put('/:id/clos', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { clos } = req.body;
        if (!clos || !Array.isArray(clos)) {
            return res.status(400).json({ success: false, message: 'clos array is required' });
        }
        await conn.query('DELETE FROM clos WHERE course_id = ?', [req.params.id]);
        if (clos.length > 0) {
            for (let i = 0; i < clos.length; i++) {
                const clo = clos[i];
                const [cloResult] = await conn.query(
                    'INSERT INTO clos (course_id, clo_number, title, description, cognitive_level) VALUES (?, ?, ?, ?, ?)',
                    [req.params.id, i + 1, clo.title, clo.description || null, clo.cognitive_level || null]
                );
                
                if (clo.mapped_plos && Array.isArray(clo.mapped_plos) && clo.mapped_plos.length > 0) {
                    const cloId = cloResult.insertId;
                    const mappingValues = clo.mapped_plos.map(ploId => [cloId, ploId]);
                    await conn.query(
                        'INSERT INTO clo_plo_mapping (clo_id, plo_id) VALUES ?',
                        [mappingValues]
                    );
                }
            }
        }
        await conn.commit();
        res.json({ success: true, message: 'CLOs updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Update CLOs error:', error);
        res.status(500).json({ success: false, message: 'Error updating CLOs' });
    } finally {
        conn.release();
    }
});

// ===================== SYLLABI =====================

// GET syllabus for a course
router.get('/:id/syllabus', async (req, res) => {
    try {
        const [syllabi] = await pool.query('SELECT * FROM syllabi WHERE course_id = ?', [req.params.id]);
        res.json({
            success: true,
            data: syllabi.length > 0 ? syllabi[0] : null
        });
    } catch (error) {
        console.error('Get syllabus error:', error);
        res.status(500).json({ success: false, message: 'Error fetching syllabus' });
    }
});

// PUT create or update syllabus
router.put('/:id/syllabus', isAdmin, async (req, res) => {
    try {
        const { course_overview, learning_objectives, weekly_schedule } = req.body;
        await pool.query(
            `INSERT INTO syllabi (course_id, course_overview, learning_objectives, weekly_schedule)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             course_overview = VALUES(course_overview),
             learning_objectives = VALUES(learning_objectives),
             weekly_schedule = VALUES(weekly_schedule)`,
            [
                req.params.id,
                course_overview || null,
                learning_objectives ? JSON.stringify(learning_objectives) : null,
                weekly_schedule ? JSON.stringify(weekly_schedule) : null
            ]
        );
        res.json({ success: true, message: 'Syllabus saved' });
    } catch (error) {
        console.error('Save syllabus error:', error);
        res.status(500).json({ success: false, message: 'Error saving syllabus' });
    }
});

// ===================== COURSE ASSIGNMENTS =====================

// GET courses assigned to logged in faculty
router.get('/assigned', async (req, res) => {
    try {
        const [assignments] = await pool.query(
            `SELECT ca.id as assignment_id, c.id as course_id, c.title, c.code, c.credit_hours,
                    s.id as semester_id, s.name as semester_name,
                    b.id as batch_id, b.name as batch_name, b.start_date, b.end_date,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_assignment_id = ca.id) as student_count
             FROM course_assignments ca
             JOIN courses c ON ca.course_id = c.id
             JOIN semesters s ON ca.semester_id = s.id
             JOIN batches b ON s.batch_id = b.id
             WHERE ca.faculty_id = ?
             ORDER BY b.start_date DESC, s.name DESC, c.code ASC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Get assigned courses error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assigned courses' });
    }
});

// GET specific course assignment details
router.get('/assignments/:id', async (req, res) => {
    try {
        const [assignments] = await pool.query(
            `SELECT ca.id as assignment_id, c.id as course_id, c.title, c.code, c.credit_hours, c.description,
                    s.id as semester_id, s.name as semester_name,
                    b.id as batch_id, b.name as batch_name,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_assignment_id = ca.id) as student_count
             FROM course_assignments ca
             JOIN courses c ON ca.course_id = c.id
             JOIN semesters s ON ca.semester_id = s.id
             JOIN batches b ON s.batch_id = b.id
             WHERE ca.id = ?`,
            [req.params.id]
        );

        if (assignments.length === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        res.json({
            success: true,
            data: assignments[0]
        });
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assignment details' });
    }
});

// POST assign course(s) to semester with faculty (supports bulk)
router.post('/assign', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { course_id, course_ids, semester_id, faculty_id } = req.body;
        
        // Support both single and bulk assignment
        const ids = course_ids && Array.isArray(course_ids) ? course_ids : (course_id ? [course_id] : []);
        
        if (ids.length === 0 || !semester_id) {
            return res.status(400).json({ success: false, message: 'course_id (or course_ids array) and semester_id are required' });
        }
        
        const results = [];
        const errors = [];
        
        for (const cId of ids) {
            try {
                const [result] = await conn.query(
                    'INSERT INTO course_assignments (course_id, semester_id, faculty_id) VALUES (?, ?, ?)',
                    [cId, semester_id, faculty_id || null]
                );
                results.push({ id: result.insertId, course_id: cId });
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    errors.push({ course_id: cId, error: 'Already assigned to this semester' });
                } else {
                    throw err;
                }
            }
        }

        // Create notification for faculty if assigned
        if (faculty_id && results.length > 0) {
            const courseIdsAssigned = results.map(r => r.course_id);
            const [courseRows] = await conn.query(
                'SELECT title, code FROM courses WHERE id IN (?)', [courseIdsAssigned]
            );
            const courseNames = courseRows.map(c => `${c.code}: ${c.title}`).join(', ');
            const count = courseRows.length;
            
            await conn.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [
                    faculty_id,
                    'Course Assignment',
                    count === 1
                        ? `You have been assigned to teach ${courseNames}.`
                        : `You have been assigned ${count} new courses: ${courseNames}.`,
                    'course_assignment'
                ]
            );
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            message: `${results.length} course(s) assigned to semester`,
            data: { assigned: results, errors }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Assign course error:', error);
        res.status(500).json({ success: false, message: 'Error assigning course' });
    } finally {
        conn.release();
    }
});

// PUT update course assignment (change faculty)
router.put('/assign/:id', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { faculty_id } = req.body;
        await conn.query(
            'UPDATE course_assignments SET faculty_id = ? WHERE id = ?',
            [faculty_id || null, req.params.id]
        );

        // Create notification for the newly assigned faculty
        if (faculty_id) {
            const [rows] = await conn.query(
                `SELECT c.title, c.code FROM course_assignments ca
                 JOIN courses c ON ca.course_id = c.id
                 WHERE ca.id = ?`, [req.params.id]
            );
            if (rows.length > 0) {
                await conn.query(
                    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                    [
                        faculty_id,
                        'Course Assignment',
                        `You have been assigned to teach ${rows[0].code}: ${rows[0].title}.`,
                        'course_assignment'
                    ]
                );
            }
        }

        await conn.commit();
        res.json({ success: true, message: 'Course assignment updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Update assignment error:', error);
        res.status(500).json({ success: false, message: 'Error updating assignment' });
    } finally {
        conn.release();
    }
});

// DELETE course assignment
router.delete('/assign/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM course_assignments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        res.json({ success: true, message: 'Course assignment removed' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ success: false, message: 'Error removing assignment' });
    }
});

export default router;
