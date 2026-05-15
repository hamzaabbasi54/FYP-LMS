import express from 'express';
import pool from '../config/db.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

const router = express.Router();
router.use(verifyToken);

// GET all parents (paginated, search)
router.get('/', isAdmin, async (req, res) => {
    try {
        const { search } = req.query;
        const { page, limit, offset } = parsePagination(req.query);

        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (search) {
            whereClause += ' AND (p.name LIKE ? OR p.email LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id_number LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term, term);
        }

        // Count total
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM parents p
             JOIN students s ON p.student_id = s.id
             ${whereClause}`, params
        );

        // Get paginated data
        const [parents] = await pool.query(
            `SELECT p.id, p.name, p.email, p.phone,
                    s.id as student_id_db, s.student_id_number as studentId, 
                    CONCAT(s.first_name, ' ', s.last_name) as studentName
             FROM parents p
             JOIN students s ON p.student_id = s.id
             ${whereClause}
             ORDER BY p.name ASC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json(paginatedResponse(parents, total, page, limit));
    } catch (error) {
        console.error('Get parents error:', error);
        res.status(500).json({ success: false, message: 'Error fetching parents' });
    }
});

export default router;
