import jwt from 'jsonwebtoken';

// Verify JWT Token Middleware
export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'KEY');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Access denied.'
        });
    }
};

// Check if user is Super Admin
export const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin privileges required.'
        });
    }
    next();
};

// Check if user is Dean
export const isDean = (req, res, next) => {
    if (!req.user || req.user.role !== 'dean') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Dean privileges required.'
        });
    }
    next();
};

// Check if user is Department Admin
export const isDeptAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'deptadmin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Department Admin privileges required.'
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

// Check if user is Admin (Super Admin, Dean, or Dept Admin)
export const isAdmin = (req, res, next) => {
    if (!req.user || !['superadmin', 'dean', 'deptadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Check if user can approve others (Super Admin, Dean, or Dept Admin)
export const canApprove = (req, res, next) => {
    if (!req.user || !['superadmin', 'dean', 'deptadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Approval privileges required.'
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

    const validRoles = ['superadmin', 'dean', 'deptadmin', 'faculty'];
    if (!validRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Invalid role.'
        });
    }
    next();
};
