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
    
    try {
        await conn.query("INSERT INTO students (student_id_number, first_name, last_name, email, batch_id, background) VALUES ('TEST03', 'Test', 'Test', 'test3@example.com', 1, 'pre-engineering')");
        console.log('Inserted pre-engineering');
    } catch(e) {
        console.log('Error pre-engineering:', e.message);
    }
    await conn.end();
}
run().catch(console.error);
