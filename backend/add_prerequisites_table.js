import 'dotenv/config';
import pool from './config/db.js';

async function migrate() {
    let conn;
    let failed = false;
    try {
        conn = await pool.getConnection();
        await conn.query(`
            CREATE TABLE IF NOT EXISTS course_prerequisites (
                course_id INT NOT NULL,
                prerequisite_course_id INT NOT NULL,
                PRIMARY KEY (course_id, prerequisite_course_id),
                CONSTRAINT fk_prereq_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_prereq_prereq FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('course_prerequisites table created');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        failed = true;
    } finally {
        if (conn) conn.release();
        if (failed) process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
}
migrate();
