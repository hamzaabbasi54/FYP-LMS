import 'dotenv/config';
import pool from './config/db.js';

async function migrate() {
    let conn;
    let failed = false;
    try {
        conn = await pool.getConnection();
        // Make course_id nullable in clos table
        await conn.query(`ALTER TABLE clos MODIFY COLUMN course_id INT DEFAULT NULL`);
        console.log('clos.course_id made nullable');

        // Create course_clo_mapping junction table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS course_clo_mapping (
                course_id INT NOT NULL,
                clo_id INT NOT NULL,
                PRIMARY KEY (course_id, clo_id),
                CONSTRAINT fk_ccm_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_ccm_clo FOREIGN KEY (clo_id) REFERENCES clos(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('course_clo_mapping table created');

        // Migrate existing data: for CLOs that have course_id set, create mapping entries
        const [existing] = await conn.query('SELECT id, course_id FROM clos WHERE course_id IS NOT NULL');
        if (existing.length > 0) {
            for (const row of existing) {
                await conn.query(
                    'INSERT IGNORE INTO course_clo_mapping (course_id, clo_id) VALUES (?, ?)',
                    [row.course_id, row.id]
                );
            }
            console.log(`Migrated ${existing.length} existing CLO-course mappings`);
        }
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
