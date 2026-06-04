// ============================================
// File: backend/middleware/deptScope.js
// Reusable department-scoping middleware
// Prevents deptadmins from accessing/modifying
// resources outside their own department.
// Uses Redis cache to avoid repeated DB lookups.
// ============================================

import pool from '../config/db.js';
import { cacheGet, cacheSet } from '../config/redis.js';

/**
 * Middleware factory: verifies a resource belongs to the requesting deptadmin's department.
 *
 * @param {string} table      - The DB table to look up (e.g., 'courses', 'students', 'departments')
 * @param {string} paramName  - The req.params key holding the resource ID (default: 'id')
 * @param {object} opts
 * @param {string} opts.deptColumn - Column that holds department_id (default: 'department_id')
 * @param {string} opts.joinQuery  - Full custom SQL returning department_id (for tables without a direct dept column)
 */
export const scopeToDepartment = (table, paramName = 'id', opts = {}) => {
    return async (req, res, next) => {
        // Only enforce for deptadmin role — super_admin can access everything
        if (req.user.role !== 'deptadmin') {
            return next();
        }

        try {
            const resourceId = req.params[paramName];
            if (!resourceId) return next();

            // Check Redis cache first (TTL: 24 hours)
            const cacheKey = `scope:${table}:${resourceId}`;
            let deptId = null;

            const cached = await cacheGet(cacheKey);
            if (cached !== null && cached !== undefined) {
                deptId = cached.department_id;
            } else {
                // Cache miss — query MySQL and populate cache
                if (opts.joinQuery) {
                    // Custom query for complex joins (e.g., students → batches → department_id)
                    const [rows] = await pool.query(opts.joinQuery, [resourceId]);
                    deptId = rows.length > 0 ? rows[0].department_id : null;
                } else {
                    const deptColumn = opts.deptColumn || 'department_id';
                    const [rows] = await pool.query(
                        `SELECT ${deptColumn} as department_id FROM ${table} WHERE id = ?`,
                        [resourceId]
                    );
                    deptId = rows.length > 0 ? rows[0].department_id : null;
                }

                // Cache the result (even null — prevents repeated lookups for deleted resources)
                if (deptId !== null) {
                    await cacheSet(cacheKey, { department_id: deptId }, 86400); // 24 hours
                }
            }

            if (deptId === null) {
                return res.status(404).json({ success: false, message: 'Resource not found' });
            }

            if (deptId !== req.user.department_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. This resource belongs to a different department.'
                });
            }

            next();
        } catch (error) {
            console.error('Department scope check error:', error.message);
            res.status(500).json({ success: false, message: 'Error verifying access' });
        }
    };
};
