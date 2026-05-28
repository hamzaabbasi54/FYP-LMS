// ============================================
// File: backend/server.js
// FYP-LMS Express Server (MySQL)
// ============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';

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

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Middleware
app.use(express.json());
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Connect to MySQL database
connectDb();

// ============================================
// ROUTES
// ============================================

// Public + Auth routes
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

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});