// ============================================
// File: backend/routes/courseRoutes.js
// Courses, CLOs, Syllabi CRUD Routes
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAdmin, isAuthenticated } from '../middleware/auth.js';
import { scopeToDepartment } from '../middleware/deptScope.js';
import { validateMagicBytes } from '../middleware/validateMagicBytes.js';
import { cacheDel, cacheGet, cacheSet, cacheDelPattern } from '../config/redis.js';
import { deleteGuard } from '../middleware/deleteGuard.js';

const scopeCourse = scopeToDepartment('courses');
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir, createExcelUpload } from '../utils/excel.js';
import { emitToDepartment } from '../utils/emitHelper.js';

const router = express.Router();
router.use(verifyToken);

const upload = createExcelUpload(multer);

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
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : req.query.department_id;
        
        let query = `SELECT c.id, c.title, c.code, c.credit_hours, d.name as department_name
                     FROM courses c JOIN departments d ON c.department_id = d.id`;
        const params = [];

        if (department_id) {
            query += ` WHERE c.department_id = ?`;
            params.push(department_id);
        }

        query += ` ORDER BY c.code`;

        const [courses] = await pool.query(query, params);
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
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : req.query.department_id;
        const cacheKey = department_id ? `cache:clos:all:${department_id}` : 'cache:clos:all';
        const cachedCLOs = await cacheGet(cacheKey);
        if (cachedCLOs) {
            return res.json({ success: true, data: cachedCLOs });
        }
        
        let whereClause = '';
        const params = [];
        if (department_id) {
            whereClause = 'WHERE cl.course_id IS NULL OR cl.course_id IN (SELECT id FROM courses WHERE department_id = ?)';
            params.push(department_id);
        }

        const [clos] = await pool.query(
            `SELECT cl.id, cl.clo_number, cl.title, cl.description, cl.cognitive_level
             FROM clos cl ${whereClause} ORDER BY cl.title, cl.clo_number`,
            params
        );

        // Fetch all course mappings in one query
        const [courseMappings] = await pool.query(`
            SELECT ccm.clo_id, c.id, c.title, c.code
            FROM course_clo_mapping ccm
            JOIN courses c ON ccm.course_id = c.id
            UNION
            SELECT cl.id as clo_id, c.id, c.title, c.code
            FROM clos cl
            JOIN courses c ON cl.course_id = c.id
        `);

        // Fetch all PLO mappings in one query
        const [ploMappings] = await pool.query(`
            SELECT DISTINCT cpm.clo_id, p.id, p.plo_number, p.description
            FROM clo_plo_mapping cpm
            JOIN plos p ON cpm.plo_id = p.id
            UNION
            SELECT DISTINCT bcpm.clo_id, p.id, p.plo_number, p.description
            FROM batch_clo_plo_mapping bcpm
            JOIN plos p ON bcpm.plo_id = p.id
        `);

        // Map them efficiently
        const courseMap = {};
        const ploMap = {};

        courseMappings.forEach(row => {
            if (!courseMap[row.clo_id]) courseMap[row.clo_id] = [];
            courseMap[row.clo_id].push({ id: row.id, title: row.title, code: row.code });
        });

        ploMappings.forEach(row => {
            if (!ploMap[row.clo_id]) ploMap[row.clo_id] = [];
            ploMap[row.clo_id].push({ id: row.id, plo_number: row.plo_number, description: row.description });
        });

        clos.forEach(clo => {
            clo.mapped_courses = courseMap[clo.id] || [];
            clo.mapped_plos = ploMap[clo.id] || [];
        });
        
        await cacheSet(cacheKey, clos, 3600); // Cache for 1 hour
        
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
        await cacheDelPattern('cache:clos:all*');
        await cacheDelPattern('course:*');
        await cacheDelPattern('dashboard:stats:*');
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
        await cacheDelPattern('cache:clos:all*');
        await cacheDelPattern('course:*');
        await cacheDelPattern('dashboard:stats:*');
        res.json({ success: true, message: 'CLO updated successfully' });
    } catch (error) {
        console.error('Update CLO error:', error);
        res.status(500).json({ success: false, message: 'Error updating CLO' });
    }
});

// POST import CLOs from Excel
router.post('/clos/import', upload.single('file'), validateMagicBytes, async (req, res) => {
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
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
        await cacheDelPattern('obe:*');
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
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
        await cacheDelPattern('obe:*');
        await cacheDelPattern('course:*');
        await cacheDelPattern('dashboard:stats:*');
        res.json({ success: true, message: 'CLO deleted successfully' });
    } catch (error) {
        console.error('Delete CLO error:', error);
        res.status(500).json({ success: false, message: 'Error deleting CLO' });
    }
});

// ===================== EXCEL IMPORT / EXPORT =====================


// POST import courses from Excel
router.post('/import', upload.single('file'), validateMagicBytes, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Excel file required.',
            expected_columns: ['title', 'code', 'department_name', 'credit_hours', 'description']
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
                    `INSERT INTO courses (title, code, department_id, credit_hours, description)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     title = VALUES(title), department_id = VALUES(department_id), 
                     credit_hours = VALUES(credit_hours), 
                     description = VALUES(description)`,
                    [
                        row.title,
                        row.code,
                        departmentId,
                        parseInt(row.credit_hours) || 3,
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
            `SELECT c.title, c.code, d.name as department_name, c.credit_hours, c.description
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
            `SELECT DISTINCT cs.id, cs.day_of_week, cs.start_time, cs.end_time, cs.shift,
                    c.id as course_id, c.title as course_name, c.code as course_code, c.credit_hours,
                    b.id as batch_id, b.name as batch_name,
                    (SELECT COUNT(*) FROM enrollments e
                     JOIN course_assignments ca2 ON e.course_assignment_id = ca2.id
                     JOIN semesters s2 ON ca2.semester_id = s2.id
                     WHERE ca2.course_id = cs.course_id AND s2.batch_id = cs.batch_id) as student_count
             FROM class_schedules cs
             JOIN courses c ON cs.course_id = c.id
             JOIN batches b ON cs.batch_id = b.id
             JOIN semesters s ON s.batch_id = b.id
             JOIN course_assignments ca ON ca.course_id = c.id AND ca.semester_id = s.id
             WHERE ca.faculty_id = ?
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
router.get('/:id/clos-for-assessment', isAuthenticated, async (req, res) => {
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

// GET courses assigned to logged in faculty
router.get('/assigned', async (req, res) => {
    try {
        const cacheKey = `facultyDashboardCourses:${req.user.id}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

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

        await cacheSet(cacheKey, assignments, 1800); // 30 minutes

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        console.error('Get assigned courses error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assigned courses' });
    }
});

// GET single course with CLOs and syllabus
router.get('/:id', async (req, res) => {

    try {
        // Parallelize database queries to significantly reduce loading time
        const [
            [courses],
            [closFromDirect],
            [closFromMapping],
            [syllabi],
            [prereqs]
        ] = await Promise.all([
            pool.query(
                `SELECT c.*, d.name as department_name
                 FROM courses c
                 JOIN departments d ON c.department_id = d.id
                 WHERE c.id = ?`,
                [req.params.id]
            ),
            // Get CLOs created directly for this course
            pool.query(
                `SELECT c.*, 
                        COALESCE((SELECT JSON_ARRAYAGG(plo_id) FROM clo_plo_mapping WHERE clo_id = c.id), '[]') as mapped_plos
                 FROM clos c WHERE c.course_id = ? ORDER BY c.clo_number`, 
                [req.params.id]
            ),
            // Get global CLOs mapped to this course via junction table
            pool.query(
                `SELECT c.*, 
                        COALESCE((SELECT JSON_ARRAYAGG(plo_id) FROM clo_plo_mapping WHERE clo_id = c.id), '[]') as mapped_plos
                 FROM course_clo_mapping ccm 
                 JOIN clos c ON ccm.clo_id = c.id
                 WHERE ccm.course_id = ? AND c.course_id IS NULL ORDER BY c.clo_number`, 
                [req.params.id]
            ),
            pool.query('SELECT * FROM syllabi WHERE course_id = ?', [req.params.id]),
            pool.query(
                `SELECT c.id, c.title, c.code FROM course_prerequisites cp
                 JOIN courses c ON cp.prerequisite_course_id = c.id
                 WHERE cp.course_id = ?`, 
                [req.params.id]
            )
        ]);

        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Combine and parse CLOs
        const allClos = [...closFromDirect, ...closFromMapping].sort((a, b) => a.clo_number - b.clo_number);
        
        allClos.forEach(clo => {
            if (typeof clo.mapped_plos === 'string') {
                try {
                    clo.mapped_plos = JSON.parse(clo.mapped_plos);
                } catch (e) {
                    clo.mapped_plos = [];
                }
            }
        });

        res.json({
            success: true,
            data: {
                ...courses[0],
                clos: allClos,
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
        const { title, code, department_id, credit_hours, semester_level, description, clos, prerequisite_ids } = req.body;

        if (!title || !code || !department_id || !credit_hours) {
            return res.status(400).json({ success: false, message: 'title, code, department_id, credit_hours are required' });
        }

        const [result] = await conn.query(
            `INSERT INTO courses (title, code, department_id, credit_hours, semester_level, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, code.toUpperCase(), department_id, credit_hours, semester_level || null, description || null]
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
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache

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
router.put('/:id', isAdmin, scopeCourse, async (req, res) => {
    try {
        const { title, code, department_id, credit_hours, semester_level, description } = req.body;
        const fields = [];
        const values = [];
        if (title) { fields.push('title = ?'); values.push(title); }
        if (code) { fields.push('code = ?'); values.push(code.toUpperCase()); }
        if (department_id) { fields.push('department_id = ?'); values.push(department_id); }
        if (credit_hours) { fields.push('credit_hours = ?'); values.push(credit_hours); }
        if (semester_level !== undefined) { fields.push('semester_level = ?'); values.push(semester_level); }
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

        // Invalidate scope cache (department_id may have changed)
        await cacheDel(`scope:courses:${req.params.id}`);
        await cacheDelPattern('course:*');
        await cacheDelPattern('dashboard:stats:*');
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: 'Error updating course' });
    }
});

// DELETE course
router.delete('/:id', isAdmin, scopeCourse, deleteGuard('course'), async (req, res) => {
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

        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
        // Invalidate scope cache for deleted resource
        await cacheDel(`scope:courses:${req.params.id}`);
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
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
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
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'CLO title is required' });
        }

        const cloPattern = /^CLO-\d+$/;
        if (!cloPattern.test(title)) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'CLO title must be in CLO-X format (e.g. CLO-1, CLO-2)' });
        }
        const cloNumber = parseInt(title.split('-')[1]);

        // Check if CLO with this title already exists for this course
        const [[existing]] = await conn.query(`
            SELECT 1 FROM clos cl
            LEFT JOIN course_clo_mapping ccm ON cl.id = ccm.clo_id AND ccm.course_id = ?
            WHERE cl.title = ? AND (cl.course_id = ? OR ccm.clo_id IS NOT NULL)
        `, [courseId, title, courseId]);

        if (existing) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'A CLO with this title is already mapped to this course' });
        }

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
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
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
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
        res.status(200).json({ success: true, message: 'CLOs mapped to course successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Map CLOs error:', error);
        res.status(500).json({ success: false, message: 'Error mapping CLOs to course' });
    } finally {
        conn.release();
    }
});

// DELETE remove a CLO from a course
router.delete('/:id/clos/:cloId', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const courseId = req.params.id;
        const cloId = req.params.cloId;

        // 1. Remove from global mapping if it was mapped from the global catalog
        await conn.query('DELETE FROM course_clo_mapping WHERE course_id = ? AND clo_id = ?', [courseId, cloId]);

        // 2. If it was a course-specific CLO directly created for this course, detach it.
        // We set course_id = NULL instead of deleting it to ensure that historical batches 
        // that have already instantiated/used this CLO are NOT affected.
        await conn.query('UPDATE clos SET course_id = NULL WHERE id = ? AND course_id = ?', [cloId, courseId]);

        await conn.commit();
        await cacheDelPattern('cache:clos:all*'); // Invalidate cache
        res.status(200).json({ success: true, message: 'CLO removed from course successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Remove CLO error:', error);
        res.status(500).json({ success: false, message: 'Error removing CLO from course' });
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
        // Notify assigned faculty about syllabus update
        const [course] = await pool.query('SELECT code, title FROM courses WHERE id = ?', [req.params.id]);
        const [assignments] = await pool.query(
            'SELECT DISTINCT faculty_id FROM course_assignments WHERE course_id = ? AND faculty_id IS NOT NULL',
            [req.params.id]
        );
        for (const a of assignments) {
            await pool.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [a.faculty_id, 'Syllabus Updated', `The syllabus for ${course[0]?.code || ''}: ${course[0]?.title || ''} has been updated.`, 'syllabus_update']
            );
        }

        res.json({ success: true, message: 'Syllabus saved' });
    } catch (error) {
        console.error('Save syllabus error:', error);
        res.status(500).json({ success: false, message: 'Error saving syllabus' });
    }
});

// ===================== COURSE ASSIGNMENTS =====================



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
        await cacheDelPattern('facultyDashboardCourses:*');
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
        await cacheDelPattern('facultyDashboardCourses:*');

        // Emit real-time WebSocket event to faculty's department
        try {
            const [[assignment]] = await pool.query(
                `SELECT c.title, c.code, b.department_id
                 FROM course_assignments ca
                 JOIN courses c ON ca.course_id = c.id
                 JOIN semesters s ON ca.semester_id = s.id
                 JOIN batches b ON s.batch_id = b.id
                 WHERE ca.id = ?`,
                [req.params.id]
            );
            if (assignment && assignment.department_id) {
                emitToDepartment(assignment.department_id, 'faculty_assigned', {
                    assignmentId: req.params.id,
                    courseCode: assignment.code,
                    courseTitle: assignment.title,
                    message: `Faculty assignment updated for ${assignment.code}: ${assignment.title}`,
                    updatedBy: req.user.email
                });
            }
        } catch (emitErr) {
            console.error('Socket emit error (non-blocking):', emitErr);
        }

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
        // Get assignment details before deleting (for notification)
        const [existing] = await pool.query(
            `SELECT ca.faculty_id, c.code, c.title FROM course_assignments ca
             JOIN courses c ON ca.course_id = c.id WHERE ca.id = ?`, [req.params.id]
        );

        const [result] = await pool.query('DELETE FROM course_assignments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Notify faculty about unassignment
        if (existing.length > 0 && existing[0].faculty_id) {
            await pool.query(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [existing[0].faculty_id, 'Course Unassigned', `You have been removed from ${existing[0].code}: ${existing[0].title}.`, 'course_unassignment']
            );
        }

        await cacheDelPattern('facultyDashboardCourses:*');
        res.json({ success: true, message: 'Course assignment removed' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ success: false, message: 'Error removing assignment' });
    }
});

export default router;
