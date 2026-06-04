const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false }
    });
    
    await conn.query("SET FOREIGN_KEY_CHECKS=0");

    const [res1] = await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id) VALUES ('TEST04', 'Test', 'Test', 'test4@example.com', 9999) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), first_name = VALUES(first_name)");
    console.log('Insert 1 ID:', res1.insertId);
    
    const [res2] = await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id) VALUES ('TEST04', 'Test', 'Test', 'test4@example.com', 9999) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), first_name = VALUES(first_name)");
    console.log('Insert 2 (no change) ID:', res2.insertId);

    await conn.query("DELETE FROM students WHERE email = 'test4@example.com'");
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
    await conn.end();
}
run().catch(console.error);
