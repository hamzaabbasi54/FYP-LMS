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

    await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id) VALUES ('U2024001', 'Test', 'Test', 'test1@example.com', 9999)");
    
    const [c1] = await conn.query("SELECT MAX(CAST(SUBSTRING(student_id_number, 6) AS UNSIGNED)) as max_num FROM students WHERE student_id_number LIKE 'U2024%'");
    console.log('Max 1:', c1[0].max_num);

    await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id) VALUES ('U2024002', 'Test', 'Test', 'test2@example.com', 9999)");

    const [c2] = await conn.query("SELECT MAX(CAST(SUBSTRING(student_id_number, 6) AS UNSIGNED)) as max_num FROM students WHERE student_id_number LIKE 'U2024%'");
    console.log('Max 2:', c2[0].max_num);

    await conn.rollback();
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
    await conn.end();
}
run().catch(console.error);
