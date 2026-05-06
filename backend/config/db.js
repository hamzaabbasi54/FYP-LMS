// ============================================
// File: backend/config/db.js
// MySQL Connection Pool using mysql2/promise
// ============================================

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'fyp_lms',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection on startup
const connectDb = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ MySQL connected successfully — Database: ${process.env.DB_NAME || 'fyp_lms'}`);
        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        process.exit(1);
    }
};

export { pool, connectDb };
export default pool;
