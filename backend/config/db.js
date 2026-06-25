// ============================================
// File: backend/config/db.js
// MySQL Connection Pool using mysql2/promise
// ============================================

import mysql from 'mysql2/promise';
import fs from 'fs';

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
if (process.env.NODE_ENV === 'production') {
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'fyp_lms',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 25),
    maxIdle: Number(process.env.DB_POOL_IDLE_LIMIT || 10),
    idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 60000),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT || 0),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
        ca: process.env.DB_CA_CERT ? fs.readFileSync(process.env.DB_CA_CERT) : undefined
    } : false
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

// Create migration connection factory
const createMigrationConnection = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'fyp_lms',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
            ca: process.env.DB_CA_CERT ? fs.readFileSync(process.env.DB_CA_CERT) : undefined
        } : false
    });
};

export { pool, connectDb, createMigrationConnection };
export default pool;
