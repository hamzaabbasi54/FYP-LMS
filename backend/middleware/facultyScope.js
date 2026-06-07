// ============================================
// File: backend/middleware/facultyScope.js
// Scopes resources to the currently logged in faculty member
// ============================================

import pool from '../config/db.js';

/**
 * Middleware factory to verify that a resource belongs to the requesting faculty member.
 * Super admins and dept admins bypass this check (they use their own scope checks).
 *
 * @param {string} resourceType - 'course_assignment', 'assessment', or 'attendance'
 * @param {string} paramSource - 'body' or 'params' to look for the ID
 * @param {string} paramName - The key name of the ID (e.g. 'id', 'course_assignment_id')
 */
export const scopeFaculty = (resourceType, paramSource, paramName) => {
    return async (req, res, next) => {
        // Only enforce for faculty role
        if (req.user.role !== 'faculty') {
            return next();
        }

        try {
            const resourceId = req[paramSource][paramName];
            if (!resourceId) {
                // If the parameter is missing but required, let the handler validate it
                return next();
            }

            let facultyId = null;

            if (resourceType === 'course_assignment') {
                const [rows] = await pool.query(
                    'SELECT faculty_id FROM course_assignments WHERE id = ?',
                    [resourceId]
                );
                facultyId = rows.length > 0 ? rows[0].faculty_id : null;
            } else if (resourceType === 'assessment') {
                const [rows] = await pool.query(
                    `SELECT ca.faculty_id 
                     FROM assessments a 
                     JOIN course_assignments ca ON a.course_assignment_id = ca.id 
                     WHERE a.id = ?`,
                    [resourceId]
                );
                facultyId = rows.length > 0 ? rows[0].faculty_id : null;
            } else if (resourceType === 'attendance') {
                const [rows] = await pool.query(
                    `SELECT ca.faculty_id 
                     FROM attendance a 
                     JOIN course_assignments ca ON a.course_assignment_id = ca.id 
                     WHERE a.id = ?`,
                    [resourceId]
                );
                facultyId = rows.length > 0 ? rows[0].faculty_id : null;
            }

            if (facultyId === null) {
                return res.status(404).json({ success: false, message: 'Resource not found' });
            }

            if (facultyId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You do not own this resource.'
                });
            }

            next();
        } catch (error) {
            console.error('Faculty scope check error:', error.message);
            res.status(500).json({ success: false, message: 'Error verifying access' });
        }
    };
};
