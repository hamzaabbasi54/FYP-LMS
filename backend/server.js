import 'dotenv/config';
import express from 'express';
import connectDb from './config/mongo.js';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import approvalRoutes from './routes/approvalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Connect to database
connectDb();

// Middleware
app.use(express.json());

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/approvals', approvalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);

// Health check
app.use('/', (req, res) => {
    res.send('University LMS API is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});