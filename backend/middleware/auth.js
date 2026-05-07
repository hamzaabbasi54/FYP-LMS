import jwt from 'jsonwebtoken';

// Verify JWT Token Middleware
export const verifyToken = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.'
            });
        }

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

// Check if user is Department Admin (the sole admin role)
export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'deptadmin') {
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

    const validRoles = ['deptadmin', 'faculty'];
    if (!validRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Invalid role.'
        });
    }
    next();
};
