import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { cacheGet, cacheSet } from '../config/redis.js';

// Verify JWT Token Middleware (with Redis-cached token_version check)
export const verifyToken = async (req, res, next) => {
    try {
        let token;

        // 1. Try HTTP-Only cookie first
        if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // 2. Fall back to Authorization header (backward compat)
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // HIGH-4: Verify token_version hasn't been bumped (password change / deactivation)
        // Strategy: Check Redis first (fast), fall back to MySQL on cache miss
        const cacheKey = `session:user:${decoded.id}`;
        let user = await cacheGet(cacheKey);

        if (!user) {
            // Cache miss — query MySQL and populate cache (TTL: 1 hour)
            const [[dbUser]] = await pool.query(
                'SELECT token_version, is_active FROM users WHERE id = ?',
                [decoded.id]
            );
            if (!dbUser) {
                return res.status(401).json({ success: false, message: 'Account not found.' });
            }
            user = { token_version: dbUser.token_version, is_active: dbUser.is_active };
            await cacheSet(cacheKey, user, 3600); // Cache for 1 hour
        }

        if (!user.is_active) {
            return res.status(401).json({ success: false, message: 'Account deactivated or not found.' });
        }
        if (user.token_version !== (decoded.token_version ?? 0)) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Access denied.'
        });
    }
};

// Check if user is Super Admin
export const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin privileges required.'
        });
    }
    next();
};

// Check if user is Department Admin (or Super Admin for global routes)
export const isAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'deptadmin' && req.user.role !== 'super_admin')) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Check if user is Faculty
export const isFaculty = (req, res, next) => {
    if (!req.user || req.user.role !== 'faculty') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Faculty privileges required.'
        });
    }
    next();
};

// Check if user is authenticated (any valid role)
export const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const validRoles = ['super_admin', 'deptadmin', 'faculty'];
    if (!validRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Invalid role.'
        });
    }
    next();
};
