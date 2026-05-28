import 'dotenv/config';
import { pool } from './config/db.js';

async function run() {
    await pool.query("UPDATE users SET role = 'super_admin' WHERE email = 'admin@gmail.com'");
    const [res] = await pool.query("SELECT id, email, role FROM users WHERE email = 'admin@gmail.com'");
    console.log(res);
    process.exit(0);
}

run();
