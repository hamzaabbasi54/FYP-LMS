// ============================================
// File: backend/server.js
// FYP-LMS Express Server (MySQL)
// ============================================

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './utils/socket.js';

// Import routes
import authRoutes from './routes/auth.js';
import approvalRoutes from './routes/approvalRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import obeRoutes from './routes/obeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Security middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,                 // 1000 requests per window per IP
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,                   // 15 attempts per window
    message: { success: false, message: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
const messageLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 30,                   // 30 messages per minute
    message: { success: false, message: 'Message rate limit reached. Slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply global rate limiter to all API routes
app.use('/api', globalLimiter);

// Connect to MySQL database
connectDb();


// ============================================
// ROUTES
// ============================================

// Public + Auth routes (with rate limiting on sensitive endpoints)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/set-password', authLimiter);
app.use('/api/auth', authRoutes);

// Approval routes (protected)
app.use('/api/approvals', approvalRoutes);

// Department & Faculty routes (protected)
app.use('/api/departments', departmentRoutes);

// Batch, Semester, PLO routes (protected)
app.use('/api/batches', batchRoutes);

// Course, CLO, Syllabus, Assignment routes (protected)
app.use('/api/courses', courseRoutes);

// Student, Parent, Enrollment routes (protected)
app.use('/api/students', studentRoutes);

// Assessment & Grade routes (protected)
app.use('/api/assessments', assessmentRoutes);

// Attendance routes (protected)
app.use('/api/attendance', attendanceRoutes);

// Parent routes (protected)
app.use('/api/parents', parentRoutes);
app.use('/api/obe', obeRoutes);

// Curriculum routes (protected)
app.use('/api/curricula', curriculumRoutes);

// Notification routes (protected)
app.use('/api/notifications', notificationRoutes);

// Message routes (protected, with send rate limit)
app.use('/api/messages/send', messageLimiter);
app.use('/api/messages', messageRoutes);

// Dashboard Analytics routes (admin only)
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'University LMS API is running!',
        database: 'MySQL',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Global error handler — hides internal details in production
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        success: false,
        message: isProd ? 'Internal Server Error' : (err.message || 'Internal Server Error')
    });
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initSocket(server, allowedOrigins);

// Connect Redis cache (non-blocking — system works without it)
connectRedis().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🔌 WebSocket server ready`);
    });
}).catch((err) => {
    console.warn('⚠️  Redis unavailable, starting without cache:', err.message);
    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT} (no cache)`);
        console.log(`🔌 WebSocket server ready`);
    });
});