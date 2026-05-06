// ============================================
// File: backend/utils/pagination.js
// Pagination Helper
// ============================================

/**
 * Parse pagination params from query string
 * @param {object} query - req.query
 * @returns {{ page, limit, offset }}
 */
export function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

/**
 * Build paginated response
 * @param {Array} data - query result rows
 * @param {number} totalCount - total row count
 * @param {number} page - current page
 * @param {number} limit - rows per page
 */
export function paginatedResponse(data, totalCount, page, limit) {
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNext: page < Math.ceil(totalCount / limit),
            hasPrev: page > 1
        }
    };
}
