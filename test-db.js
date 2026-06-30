import pool from './backend/config/db.js';

async function run() {
    try {
        const [rows] = await pool.query('SELECT id, full_name, email, role FROM users');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
