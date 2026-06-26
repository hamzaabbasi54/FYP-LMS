// ============================================
// File: backend/middleware/deleteGuard.js
// Pre-flight middleware for high-risk DELETE routes.
// Counts cascade impact and requires explicit confirmation.
// ============================================

import pool from '../config/db.js';

/**
 * Factory function that creates a delete guard middleware.
 * @param {string} entityType - The type of entity being deleted (e.g. 'batch', 'department', 'course', 'student')
 * @param {Object} options
 * @param {string} options.paramName - The route param containing the entity ID (default: 'id')
 * @returns Express middleware
 */
export const deleteGuard = (entityType, options = {}) => {
    const { paramName = 'id' } = options;

    return async (req, res, next) => {
        // If the request already includes confirmation, skip the guard
        const confirmed = req.body?.confirm === true || req.query?.confirm === 'true';
        const isDryRun = req.body?.dryRun === true || req.query?.dryRun === 'true';
        
        if (confirmed) {
            return next();
        }

        const entityId = req.params[paramName];

        try {
            let impact = {};
            let entityName = '';

            switch (entityType) {
                case 'batch': {
                    const [[batch]] = await pool.query('SELECT name FROM batches WHERE id = ?', [entityId]);
                    entityName = batch?.name || `Batch #${entityId}`;

                    const [[{ studentCount }]] = await pool.query(
                        'SELECT COUNT(*) as studentCount FROM students WHERE batch_id = ?', [entityId]
                    );
                    const [[{ enrollmentCount }]] = await pool.query(
                        `SELECT COUNT(*) as enrollmentCount FROM enrollments e
                         JOIN course_assignments ca ON e.course_assignment_id = ca.id
                         JOIN semesters s ON ca.semester_id = s.id
                         WHERE s.batch_id = ?`, [entityId]
                    );

                    impact = { students: studentCount, enrollments: enrollmentCount };
                    break;
                }

                case 'department': {
                    const [[dept]] = await pool.query('SELECT name FROM departments WHERE id = ?', [entityId]);
                    entityName = dept?.name || `Department #${entityId}`;

                    const [[{ batchCount }]] = await pool.query(
                        'SELECT COUNT(*) as batchCount FROM batches WHERE department_id = ?', [entityId]
                    );
                    const [[{ courseCount }]] = await pool.query(
                        'SELECT COUNT(*) as courseCount FROM courses WHERE department_id = ?', [entityId]
                    );
                    const [[{ studentCount }]] = await pool.query(
                        `SELECT COUNT(*) as studentCount FROM students s 
                         JOIN batches b ON s.batch_id = b.id
                         WHERE b.department_id = ?`, [entityId]
                    );

                    impact = { batches: batchCount, courses: courseCount, students: studentCount };
                    break;
                }

                case 'faculty': {
                    const [[fac]] = await pool.query('SELECT name FROM faculties WHERE id = ?', [entityId]);
                    entityName = fac?.name || `Faculty #${entityId}`;

                    const [[{ deptCount }]] = await pool.query(
                        'SELECT COUNT(*) as deptCount FROM departments WHERE faculty_id = ?', [entityId]
                    );
                    const [[{ batchCount }]] = await pool.query(
                        `SELECT COUNT(*) as batchCount FROM batches b
                         JOIN departments d ON b.department_id = d.id
                         WHERE d.faculty_id = ?`, [entityId]
                    );

                    impact = { departments: deptCount, batches: batchCount };
                    break;
                }

                case 'course': {
                    const [[course]] = await pool.query('SELECT title, code FROM courses WHERE id = ?', [entityId]);
                    entityName = course ? `${course.code} - ${course.title}` : `Course #${entityId}`;

                    const [[{ cloCount }]] = await pool.query(
                        'SELECT COUNT(*) as cloCount FROM clos WHERE course_id = ?', [entityId]
                    );
                    const [[{ assignmentCount }]] = await pool.query(
                        'SELECT COUNT(*) as assignmentCount FROM course_assignments WHERE course_id = ?', [entityId]
                    );

                    impact = { clos: cloCount, assignments: assignmentCount };
                    break;
                }

                case 'students_bulk': {
                    const studentIds = req.body?.student_ids || [];
                    entityName = `${studentIds.length} student(s)`;

                    if (studentIds.length > 0) {
                        const placeholders = studentIds.map(() => '?').join(',');
                        const [[{ enrollmentCount }]] = await pool.query(
                            `SELECT COUNT(*) as enrollmentCount FROM enrollments WHERE student_id IN (${placeholders})`,
                            studentIds
                        );
                        impact = { students: studentIds.length, enrollments: enrollmentCount };
                    } else {
                        impact = { students: 0, enrollments: 0 };
                    }
                    break;
                }

                default:
                    if (isDryRun) {
                        return res.status(200).json({ success: true, requiresConfirmation: false, hasActiveData: false });
                    }
                    return next();
            }

            // Check if there's any active data
            const totalImpact = Object.values(impact).reduce((sum, v) => sum + v, 0);
            const hasActiveData = totalImpact > 0;

            return res.status(200).json({
                success: true,
                requiresConfirmation: true,
                entityType,
                entityName,
                hasActiveData,
                impact,
                message: hasActiveData
                    ? `"${entityName}" contains active data. Are you sure you want to delete it? This action cannot be undone.`
                    : `Delete "${entityName}"? This action cannot be undone.`
            });

        } catch (error) {
            console.error(`[deleteGuard] Error checking impact for ${entityType}:`, error);
            if (isDryRun) {
                return res.status(500).json({ success: false, message: 'Pre-flight check failed due to server error' });
            }
            // On error, let the delete proceed rather than blocking
            return next();
        }
    };
};
