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
import { emitToDepartment } from '../utils/emitHelper.js';

const router = express.Router();
router.use(verifyToken);

const upload = multer({ dest: getUploadDir() });

// ===================== COURSES =====================

// GET all courses (paginated, with department name)
router.get('/', async (req, res) => {
    try {
        const { department_id: queryDeptId, search } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        // Force department scope for dept admins
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : queryDeptId;

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
            // Get mapped courses from both junction table and direct course_id
            const [courses] = await pool.query(
                `SELECT c.id, c.title, c.code 
                 FROM courses c
                 LEFT JOIN course_clo_mapping ccm ON c.id = ccm.course_id AND ccm.clo_id = ?
                 LEFT JOIN clos cl ON c.id = cl.course_id AND cl.id = ?
                 WHERE ccm.clo_id IS NOT NULL OR cl.course_id IS NOT NULL
                 GROUP BY c.id, c.title, c.code`, 
                 [clo.id, clo.id]
            );
            clo.mapped_courses = courses;
            
            // Get mapped PLOs from both global mappings and batch-specific mappings
            const [plos] = await pool.query(
                `SELECT p.id, p.plo_number, p.description
                 FROM plos p
                 LEFT JOIN clo_plo_mapping cpm ON p.id = cpm.plo_id AND cpm.clo_id = ?
                 LEFT JOIN batch_clo_plo_mapping bcpm ON p.id = bcpm.plo_id AND bcpm.clo_id = ?
                 WHERE cpm.clo_id IS NOT NULL OR bcpm.clo_id IS NOT NULL
                 GROUP BY p.id, p.plo_number, p.description`, 
                 [clo.id, clo.id]
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

        // Check for duplicate standalone CLO with same title
        const [existing] = await conn.query(
            'SELECT id FROM clos WHERE title = ? AND course_id IS NULL',
            [title]
        );
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: `CLO with title '${title}' already exists` });
        }

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

// PUT update individual CLO
router.put('/clos/:id', isAdmin, async (req, res) => {
    try {
        const { title, description, cognitive_level } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: 'CLO title is required' });
        }
        const [result] = await pool.query(
            'UPDATE clos SET title = ?, description = ?, cognitive_level = ? WHERE id = ?',
            [title, description || null, cognitive_level || null, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'CLO not found' });
        }
        res.json({ success: true, message: 'CLO updated successfully' });
    } catch (error) {
        console.error('Update CLO error:', error);
        res.status(500).json({ success: false, message: 'Error updating CLO' });
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
                // Expect: clo_number, description, cognitive_level (course_code is removed as CLOs are independent)
                if (!row.clo_number && !row.title) {
                    skipped++;
                    errors.push({ row: i + 2, error: 'Missing clo_number or title' });
                    continue;
                }

                let title = row.title;
                let cloNum = parseInt(row.clo_number);

                if (!title && cloNum) {
                    title = `CLO-${cloNum}`;
                } else if (title && !cloNum) {
                    const match = title.match(/^CLO-(\d+)$/i);
                    if (match) {
                        cloNum = parseInt(match[1]);
                        title = title.toUpperCase();
                    } else {
                        skipped++;
                        errors.push({ row: i + 2, error: 'CLO title must be in format CLO-X (e.g., CLO-1)' });
                        continue;
                    }
                }

                if (!title || !cloNum) {
                    skipped++;
                    errors.push({ row: i + 2, error: 'Invalid CLO format' });
                    continue;
                }

                await conn.query(
                    `INSERT INTO clos (course_id, clo_number, title, description, cognitive_level)
                     VALUES (NULL, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE description = VALUES(description), cognitive_level = VALUES(cognitive_level)`,
                    [cloNum, title, row.description || null, row.cognitive_level || null]
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
            `SELECT cl.clo_number, cl.title, cl.description, cl.cognitive_level
             FROM clos cl 
             ORDER BY cl.title, cl.clo_number`
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

// DELETE CLO by ID
router.delete('/clos/:cloId', isAdmin, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM clos WHERE id = ?', [req.params.cloId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'CLO not found' });
        }
        res.json({ success: true, message: 'CLO deleted successfully' });
    } catch (error) {
        console.error('Delete CLO error:', error);
        res.status(500).json({ success: false, message: 'Error deleting CLO' });
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

// GET weekly schedule for logged-in faculty (real data from class_schedules)
router.get('/my-schedule', async (req, res) => {
    try {
        const [schedule] = await pool.query(
            `SELECT cs.id, cs.day_of_week, cs.start_time, cs.end_time, cs.shift,
                    c.id as course_id, c.title as course_name, c.code as course_code, c.credit_hours,
                    b.id as batch_id, b.name as batch_name,
                    (SELECT COUNT(*) FROM enrollments e
                     JOIN course_assignments ca2 ON e.course_assignment_id = ca2.id
                     JOIN semesters s2 ON ca2.semester_id = s2.id
                     WHERE ca2.course_id = cs.course_id AND s2.batch_id = cs.batch_id) as student_count
             FROM class_schedules cs
             JOIN courses c ON cs.course_id = c.id
             JOIN batches b ON cs.batch_id = b.id
             WHERE cs.faculty_id = ?
             ORDER BY FIELD(cs.day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
                      cs.start_time`,
            [req.user.id]
        );
        res.json({ success: true, data: schedule });
    } catch (error) {
        console.error('Get faculty schedule error:', error);
        res.status(500).json({ success: false, message: 'Error fetching schedule' });
    }
});

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
                } catch (e) {
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

        // Emit real-time event to department
        emitToDepartment(department_id, 'course_created', {
            courseId, title, code: code.toUpperCase(),
            message: `New course "${title}" created by Admin`,
            updatedBy: req.user.email
        });

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

        // Emit real-time event to department
        const [[course]] = await pool.query('SELECT department_id, title FROM courses WHERE id = ?', [req.params.id]);
        if (course) {
            emitToDepartment(course.department_id, 'course_updated', {
                courseId: req.params.id,
                title: title || course.title,
                message: `Course "${title || course.title}" updated by Admin`,
                updatedBy: req.user.email
            });
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
        // Get department_id before deletion
        const [[course]] = await pool.query('SELECT department_id, title FROM courses WHERE id = ?', [req.params.id]);

        const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Emit real-time event to department
        if (course) {
            emitToDepartment(course.department_id, 'course_deleted', {
                courseId: req.params.id,
                message: `Course "${course.title}" deleted by Admin`,
                updatedBy: req.user.email
            });
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

// POST add a single CLO to a course
router.post('/:id/clos/single', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { title, description, cognitive_level } = req.body;
        const courseId = req.params.id;

        if (!title) {
            return res.status(400).json({ success: false, message: 'CLO title is required' });
        }

        const cloPattern = /^CLO-\d+$/;
        if (!cloPattern.test(title)) {
            return res.status(400).json({ success: false, message: 'CLO title must be in CLO-X format (e.g. CLO-1, CLO-2)' });
        }
        const cloNumber = parseInt(title.split('-')[1]);

        // Insert directly mapping to course
        const [result] = await conn.query(
            'INSERT INTO clos (course_id, clo_number, title, description, cognitive_level) VALUES (?, ?, ?, ?, ?)',
            [courseId, cloNumber, title, description || null, cognitive_level || null]
        );

        // Also insert into the course_clo_mapping junction table
        await conn.query(
            'INSERT IGNORE INTO course_clo_mapping (course_id, clo_id) VALUES (?, ?)',
            [courseId, result.insertId]
        );

        await conn.commit();
        res.status(201).json({ success: true, message: 'CLO added to course', data: { id: result.insertId } });
    } catch (error) {
        await conn.rollback();
        console.error('Add single CLO error:', error);
        res.status(500).json({ success: false, message: 'Error adding CLO to course' });
    } finally {
        conn.release();
    }
});

// POST map existing CLOs to a course
router.post('/:id/clos/map', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const courseId = req.params.id;
        const { clo_ids } = req.body;

        if (!clo_ids || !Array.isArray(clo_ids) || clo_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'clo_ids array is required and cannot be empty' });
        }

        // Use IGNORE to avoid duplicate key errors if already mapped
        const cloValues = clo_ids.map(cloId => [courseId, cloId]);
        await conn.query('INSERT IGNORE INTO course_clo_mapping (course_id, clo_id) VALUES ?', [cloValues]);

        await conn.commit();
        res.status(200).json({ success: true, message: 'CLOs mapped to course successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Map CLOs error:', error);
        res.status(500).json({ success: false, message: 'Error mapping CLOs to course' });
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
