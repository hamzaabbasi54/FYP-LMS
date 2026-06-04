// ============================================
// File: backend/routes/attendanceRoutes.js
// Attendance CRUD Routes + Excel Import/Export
// ============================================

import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { verifyToken, isAuthenticated } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { parseExcel, generateExcel, getUploadDir, createExcelUpload } from '../utils/excel.js';

const router = express.Router();
router.use(verifyToken);

const upload = createExcelUpload(multer);

// GET attendance for a course on a specific date (paginated)
router.get('/course/:courseAssignmentId', async (req, res) => {
    try {
        const { date } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        let whereClause = 'WHERE a.course_assignment_id = ?';
        const params = [req.params.courseAssignmentId];
        if (date) { whereClause += ' AND a.date = ?'; params.push(date); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM attendance a ${whereClause}`, params
        );

        const [records] = await pool.query(
            `SELECT a.*, s.first_name, s.last_name, s.student_id_number
             FROM attendance a
             JOIN students s ON a.student_id = s.id
             ${whereClause}
             ORDER BY s.last_name, s.first_name
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Summary stats (across all pages, not just current)
        const [allRecords] = await pool.query(
            `SELECT status FROM attendance a ${whereClause}`, params
        );
        const present = allRecords.filter(r => r.status === 'present').length;
        const absent = allRecords.filter(r => r.status === 'absent').length;
        const late = allRecords.filter(r => r.status === 'late').length;

        const response = paginatedResponse(records, total, page, limit);
        response.summary = { total: allRecords.length, present, absent, late };
        res.json(response);
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: 'Error fetching attendance' });
    }
});

// GET attendance summary for a course (all dates)
router.get('/summary/:courseAssignmentId', async (req, res) => {
    try {
        const [summary] = await pool.query(
            `SELECT date,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
                    COUNT(*) as total
             FROM attendance WHERE course_assignment_id = ?
             GROUP BY date ORDER BY date DESC`,
            [req.params.courseAssignmentId]
        );
        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ success: false, message: 'Error fetching summary' });
    }
});

// GET attendance for a specific student (paginated)
router.get('/student/:studentId', async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);

        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM attendance WHERE student_id = ?', [req.params.studentId]
        );

        const [records] = await pool.query(
            `SELECT a.*, c.title as course_title, c.code as course_code
             FROM attendance a
             JOIN course_assignments ca ON a.course_assignment_id = ca.id
             JOIN courses c ON ca.course_id = c.id
             WHERE a.student_id = ?
             ORDER BY a.date DESC
             LIMIT ? OFFSET ?`,
            [req.params.studentId, limit, offset]
        );

        res.json(paginatedResponse(records, total, page, limit));
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ success: false, message: 'Error fetching student attendance' });
    }
});

// POST save attendance (bulk upsert for a date)
router.post('/course/:courseAssignmentId', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { date, records } = req.body;

        if (!date || !records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'date and records array are required' });
        }

        for (const record of records) {
            await conn.query(
                `INSERT INTO attendance (course_assignment_id, student_id, date, status, remarks)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)`,
                [req.params.courseAssignmentId, record.student_id, date, record.status || 'present', record.remarks || '']
            );
        }

        await conn.commit();
        res.json({ success: true, message: `Attendance saved for ${records.length} students` });
    } catch (error) {
        await conn.rollback();
        console.error('Save attendance error:', error);
        res.status(500).json({ success: false, message: 'Error saving attendance' });
    } finally {
        conn.release();
    }
});

// ===================== EXCEL IMPORT =====================

// POST import attendance from Excel
router.post('/import/:courseAssignmentId', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Excel file required.',
            expected_columns: ['student_id_number', 'date', 'status', 'remarks']
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const rows = parseExcel(req.file.path);

        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Look up student by student_id_number
                const [students] = await conn.query(
                    'SELECT id FROM students WHERE student_id_number = ?', [row.student_id_number]
                );
                if (students.length === 0) {
                    skipped++;
                    errors.push({ row: i + 2, student: row.student_id_number, error: 'Student not found' });
                    continue;
                }

                await conn.query(
                    `INSERT INTO attendance (course_assignment_id, student_id, date, status, remarks)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)`,
                    [req.params.courseAssignmentId, students[0].id, row.date, row.status || 'present', row.remarks || '']
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
            message: `Import complete: ${imported} records saved, ${skipped} skipped`,
            data: { imported, skipped, errors: errors.slice(0, 20) }
        });
    } catch (error) {
        await conn.rollback();
        console.error('Import attendance error:', error);
        res.status(500).json({ success: false, message: 'Error importing attendance' });
    } finally {
        conn.release();
    }
});

// ===================== MONTHLY ATTENDANCE =====================

// GET all attendance for a course in a specific month (no pagination — for monthly grid view)
router.get('/monthly/:courseAssignmentId', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'month and year query params are required' });
        }

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        const [records] = await pool.query(
            `SELECT a.id, a.student_id, a.date, a.status, a.remarks,
                    s.first_name, s.last_name, s.student_id_number
             FROM attendance a
             JOIN students s ON a.student_id = s.id
             WHERE a.course_assignment_id = ? AND a.date >= ? AND a.date <= ?
             ORDER BY s.last_name, s.first_name, a.date`,
            [req.params.courseAssignmentId, startDate, endDateStr]
        );

        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Get monthly attendance error:', error);
        res.status(500).json({ success: false, message: 'Error fetching monthly attendance' });
    }
});

// GET export monthly attendance as Excel (grid format: students × dates)
router.get('/export-monthly/:courseAssignmentId', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'month and year query params are required' });
        }

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        const daysInMonth = endDate.getDate();

        // Get enrolled students
        const [students] = await pool.query(
            `SELECT s.id, s.student_id_number, s.first_name, s.last_name
             FROM students s
             JOIN enrollments e ON s.id = e.student_id
             WHERE e.course_assignment_id = ?
             ORDER BY s.last_name, s.first_name`,
            [req.params.courseAssignmentId]
        );

        // Get attendance records for the month
        const [records] = await pool.query(
            `SELECT a.student_id, a.date, a.status
             FROM attendance a
             WHERE a.course_assignment_id = ? AND a.date >= ? AND a.date <= ?`,
            [req.params.courseAssignmentId, startDate, endDateStr]
        );

        // Build lookup: { studentId: { day: status } }
        const attendanceMap = {};
        records.forEach(r => {
            if (!attendanceMap[r.student_id]) attendanceMap[r.student_id] = {};
            const day = new Date(r.date).getDate();
            attendanceMap[r.student_id][day] = r.status;
        });

        // Build Excel rows
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const excelRows = students.map(student => {
            const row = {
                'Student ID': student.student_id_number,
                'Name': `${student.first_name} ${student.last_name}`
            };

            let presentCount = 0;
            let totalWeekdays = 0;

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(parseInt(year), parseInt(month) - 1, day);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const dayLabel = `${dayNames[date.getDay()]} ${String(day).padStart(2, '0')}`;

                if (isWeekend) {
                    row[dayLabel] = '-';
                } else {
                    totalWeekdays++;
                    const status = attendanceMap[student.id]?.[day] || '';
                    row[dayLabel] = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';
                    if (status === 'present' || status === 'late') presentCount++;
                }
            }

            row['Attendance %'] = totalWeekdays > 0 ? `${Math.round((presentCount / totalWeekdays) * 100)}%` : 'N/A';
            return row;
        });

        if (excelRows.length === 0) {
            return res.status(404).json({ success: false, message: 'No data to export' });
        }

        const buffer = generateExcel(excelRows, `Attendance ${monthNames[parseInt(month) - 1]} ${year}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${monthNames[parseInt(month) - 1]}_${year}.xlsx`);
        res.send(buffer);
    } catch (error) {
        console.error('Export monthly attendance error:', error);
        res.status(500).json({ success: false, message: 'Error exporting monthly attendance' });
    }
});

export default router;

