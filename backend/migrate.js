import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

    console.log('Starting migration...');
    const conn = await pool.getConnection();
    try {
        // Disable foreign key checks temporarily for smooth drops
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        
        for (const stmt of statements) {
            try {
                if (stmt.trim()) {
                    await conn.query(stmt);
                }
            } catch (err) {
                console.error('Error executing statement:', stmt.substring(0, 50) + '...');
                console.error(err.message);
                throw err;
            }
        }
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        conn.release();
        process.exit(0);
    }
}

migrate();
