// ============================================
// File: backend/routes/departmentRoutes.js
// Department & Faculty CRUD Routes
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { scopeToDepartment } from '../middleware/deptScope.js';
import { validateMagicBytes } from '../middleware/validateMagicBytes.js';
import { deleteGuard } from '../middleware/deleteGuard.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis.js';

const scopeDept = scopeToDepartment('departments');
const scopePLO = scopeToDepartment('plos', 'ploId', { deptColumn: 'department_id' });
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir, createExcelUpload } from '../utils/excel.js';

const upload = createExcelUpload(multer);

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ===================== FACULTIES =====================

// GET all faculties
router.get('/faculties', async (req, res) => {
    try {
        const [faculties] = await pool.query(
            `SELECT f.*, 
                    (SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.id) as department_count
             FROM faculties f ORDER BY f.name`
        );
        res.json({ success: true, data: faculties });
    } catch (error) {
        console.error('Get faculties error:', error);
        res.status(500).json({ success: false, message: 'Error fetching faculties' });
    }
});

// POST create faculty (admin only)
router.post('/faculties', isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Faculty name is required (min 2 chars)' });
        }
        const [result] = await pool.query('INSERT INTO faculties (name) VALUES (?)', [name.trim()]);
        res.status(201).json({
            success: true,
            message: 'Faculty created',
            data: { id: result.insertId, name: name.trim() }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Faculty already exists' });
        }
        console.error('Create faculty error:', error);
        res.status(500).json({ success: false, message: 'Error creating faculty' });
    }
});

// PUT update faculty (admin only)
router.put('/faculties/:id', isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Faculty name is required' });
        }
        const [result] = await pool.query('UPDATE faculties SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }
        res.json({ success: true, message: 'Faculty updated' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Faculty name already exists' });
        }
        console.error('Update faculty error:', error);
        res.status(500).json({ success: false, message: 'Error updating faculty' });
    }
});

// DELETE faculty (admin only)
router.delete('/faculties/:id', isAdmin, deleteGuard('faculty'), async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM faculties WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }
        res.json({ success: true, message: 'Faculty deleted' });
    } catch (error) {
        console.error('Delete faculty error:', error);
        res.status(500).json({ success: false, message: 'Error deleting faculty' });
    }
});

// ===================== DEPARTMENTS =====================

// GET all departments (paginated, with faculty name)
router.get('/', async (req, res) => {
    try {
        const { faculty_id, search } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        let whereClause = 'WHERE 1=1';
        const params = [];
        if (faculty_id) { whereClause += ' AND d.faculty_id = ?'; params.push(faculty_id); }
        if (search) { whereClause += ' AND d.name LIKE ?'; params.push(`%${search}%`); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM departments d ${whereClause}`, params
        );

        const [departments] = await pool.query(
            `SELECT d.*, f.name as faculty_name
             FROM departments d
             JOIN faculties f ON d.faculty_id = f.id
             ${whereClause}
             ORDER BY f.name, d.name
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json(paginatedResponse(departments, total, page, limit));
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ success: false, message: 'Error fetching departments' });
    }
});

// GET departments by faculty ID
router.get('/by-faculty/:facultyId', async (req, res) => {
    try {
        const [departments] = await pool.query(
            'SELECT * FROM departments WHERE faculty_id = ? ORDER BY name',
            [req.params.facultyId]
        );
        res.json({ success: true, data: departments });
    } catch (error) {
        console.error('Get departments by faculty error:', error);
        res.status(500).json({ success: false, message: 'Error fetching departments' });
    }
});

// GET single department
router.get('/:id', async (req, res) => {
    try {
        const [departments] = await pool.query(
            `SELECT d.*, f.name as faculty_name
             FROM departments d
             JOIN faculties f ON d.faculty_id = f.id
             WHERE d.id = ?`,
            [req.params.id]
        );
        if (departments.length === 0) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.json({ success: true, data: departments[0] });
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({ success: false, message: 'Error fetching department' });
    }
});

// POST create department (admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, faculty_id } = req.body;
        if (!name || !faculty_id) {
            return res.status(400).json({ success: false, message: 'Name and faculty_id are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO departments (name, faculty_id) VALUES (?, ?)',
            [name.trim(), faculty_id]
        );
        res.status(201).json({
            success: true,
            message: 'Department created',
            data: { id: result.insertId, name: name.trim(), faculty_id }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Department already exists in this faculty' });
        }
        console.error('Create department error:', error);
        res.status(500).json({ success: false, message: 'Error creating department' });
    }
});

// PUT update department
router.put('/:id', isAdmin, scopeDept, async (req, res) => {
    try {
        const { name, faculty_id } = req.body;
        const fields = [];
        const values = [];
        if (name) { fields.push('name = ?'); values.push(name.trim()); }
        if (faculty_id) { fields.push('faculty_id = ?'); values.push(faculty_id); }
        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        values.push(req.params.id);
        const [result] = await pool.query(
            `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.json({ success: true, message: 'Department updated' });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ success: false, message: 'Error updating department' });
    }
});

// DELETE department
router.delete('/:id', isAdmin, scopeDept, deleteGuard('department'), async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.json({ success: true, message: 'Department deleted' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ success: false, message: 'Error deleting department' });
    }
});

// ===================== PLOS =====================

// GET all PLOs (dept-admin scoped)
router.get('/plos/all', async (req, res) => {
    try {
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : req.query.department_id;
        const cacheKey = `plos:${department_id}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        const [plos] = await pool.query(
            'SELECT * FROM plos WHERE department_id = ? ORDER BY plo_number',
            [department_id]
        );
        await cacheSet(cacheKey, plos, 2592000); // 30 days
        res.json({ success: true, data: plos });
    } catch (error) {
        console.error('Get all PLOs error:', error);
        res.status(500).json({ success: false, message: 'Error fetching PLOs' });
    }
});

// POST add single PLO
router.post('/plos/add', isAdmin, async (req, res) => {
    try {
        const { plo_number, description } = req.body;
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : req.body.department_id;
        if (!department_id || !plo_number || !description) {
            return res.status(400).json({ success: false, message: 'department_id, plo_number, and description are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO plos (department_id, plo_number, description) VALUES (?, ?, ?)',
            [department_id, plo_number, description]
        );
        await cacheDelPattern('plos:*');
        res.status(201).json({ success: true, message: 'PLO added', data: { id: result.insertId } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: `PLO number already exists for this department` });
        }
        console.error('Add PLO error:', error);
        res.status(500).json({ success: false, message: 'Error adding PLO' });
    }
});

// DELETE single PLO
router.delete('/plos/:ploId', isAdmin, scopePLO, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM plos WHERE id = ?', [req.params.ploId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'PLO not found' });
        }
        await cacheDelPattern('plos:*');
        res.json({ success: true, message: 'PLO deleted' });
    } catch (error) {
        console.error('Delete PLO error:', error);
        res.status(500).json({ success: false, message: 'Error deleting PLO' });
    }
});

// POST import PLOs from Excel
router.post('/plos/import', isAdmin, upload.single('file'), validateMagicBytes, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : req.body.department_id;
        if (!department_id) {
            return res.status(400).json({ success: false, message: 'department_id is required' });
        }
        const rows = parseExcel(req.file.path);
        let imported = 0, skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const ploNum = parseInt(row.plo_number);
                const desc = row.description;
                if (!ploNum || !desc) {
                    skipped++;
                    errors.push({ row: i + 2, error: 'Missing plo_number or description' });
                    continue;
                }
                await conn.query(
                    `INSERT INTO plos (department_id, plo_number, description)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE description = VALUES(description)`,
                    [department_id, ploNum, desc]
                );
                imported++;
            } catch (err) {
                skipped++;
                errors.push({ row: i + 2, error: err.message });
            }
        }
        await conn.commit();
        await cacheDelPattern('plos:*');
        res.json({ success: true, message: `PLO import: ${imported} saved, ${skipped} skipped`, data: { imported, skipped, errors: errors.slice(0, 20) } });
    } catch (error) {
        await conn.rollback();
        console.error('Import PLOs error:', error);
        res.status(500).json({ success: false, message: 'Error importing PLOs' });
    } finally {
        conn.release();
    }
});

// GET export PLOs as Excel
router.get('/plos/export', async (req, res) => {
    try {
        const department_id = (req.user.role === 'deptadmin') ? req.user.department_id : req.query.department_id;
        if (!department_id) {
            return res.status(400).json({ success: false, message: 'department_id is required' });
        }
        const [plos] = await pool.query(
            'SELECT plo_number, description FROM plos WHERE department_id = ? ORDER BY plo_number',
            [department_id]
        );
        if (plos.length === 0) {
            return res.status(404).json({ success: false, message: 'No PLOs to export' });
        }
        const buffer = generateExcel(plos, 'PLOs');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plos_export.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Export PLOs error:', error);
        res.status(500).json({ success: false, message: 'Error exporting PLOs' });
    }
});

// GET PLOs for a department (legacy route)
router.get('/:id/plos', async (req, res) => {
    try {
        const cacheKey = `plos:${req.params.id}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        const [plos] = await pool.query(
            'SELECT * FROM plos WHERE department_id = ? ORDER BY plo_number',
            [req.params.id]
        );
        await cacheSet(cacheKey, plos, 2592000);
        res.json({ success: true, data: plos });
    } catch (error) {
        console.error('Get PLOs error:', error);
        res.status(500).json({ success: false, message: 'Error fetching PLOs' });
    }
});

// PUT update PLOs for a department (replace all)
router.put('/:id/plos', isAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { plos } = req.body;
        if (!plos || !Array.isArray(plos)) {
            return res.status(400).json({ success: false, message: 'plos array is required' });
        }

        await conn.query('DELETE FROM plos WHERE department_id = ?', [req.params.id]);
        if (plos.length > 0) {
            const ploValues = plos.map((desc, i) => [req.params.id, i + 1, desc]);
            await conn.query('INSERT INTO plos (department_id, plo_number, description) VALUES ?', [ploValues]);
        }

        await conn.commit();
        await cacheDelPattern('plos:*');
        res.json({ success: true, message: 'PLOs updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Update PLOs error:', error);
        res.status(500).json({ success: false, message: 'Error updating PLOs' });
    } finally {
        conn.release();
    }
});

export default router;
