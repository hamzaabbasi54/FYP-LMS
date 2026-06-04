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
    await conn.beginTransaction();

    await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id) VALUES ('TEST05', 'Test', 'Test', 'test5@example.com', 9999)");
    
    const [c1] = await conn.query("SELECT COUNT(*) as count FROM students WHERE student_id_number LIKE 'TEST%'");
    console.log('Count 1:', c1[0].count);

    await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id) VALUES ('TEST06', 'Test', 'Test', 'test6@example.com', 9999)");

    const [c2] = await conn.query("SELECT COUNT(*) as count FROM students WHERE student_id_number LIKE 'TEST%'");
    console.log('Count 2:', c2[0].count);

    await conn.rollback();
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
    await conn.end();
}
run().catch(console.error);
