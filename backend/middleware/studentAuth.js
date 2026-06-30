import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { cacheGet, cacheSet } from '../config/redis.js';

/** Verify JWT for student mobile app (Bearer token or student_token cookie) */
export const verifyStudentToken = async (req, res, next) => {
    try {
        let token;

        if (req.cookies?.student_token) {
            token = req.cookies.student_token;
        }

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Student access only.' });
        }

        const cacheKey = `session:student:${decoded.id}`;
        let account = await cacheGet(cacheKey);

        if (!account) {
            const [[dbAccount]] = await pool.query(
                'SELECT token_version, is_active, student_id FROM student_accounts WHERE id = ?',
                [decoded.id]
            );
            if (!dbAccount) {
                return res.status(401).json({ success: false, message: 'Account not found.' });
            }
            account = {
                token_version: dbAccount.token_version,
                is_active: dbAccount.is_active,
                student_id: dbAccount.student_id,
            };
            await cacheSet(cacheKey, account, 3600);
        }

        if (!account.is_active || account.is_active === 0) {
            return res.status(401).json({ success: false, message: 'Account deactivated.' });
        }
        if (Number(account.token_version) !== Number(decoded.token_version ?? 0)) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        req.student = {
            id: decoded.id,
            student_id: decoded.student_id ?? account.student_id,
            email: decoded.email,
            role: 'student',
        };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token. Access denied.' });
    }
};
