import 'dotenv/config';
import pool from './config/db.js';

async function addNotificationsTable() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_notifications_user (user_id),
                CONSTRAINT fk_notifications_user 
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('notifications table created successfully');
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('notifications table already exists');
        } else {
            console.error('❌ Migration failed:', err);
            conn.release();
            process.exit(1);
        }
    } finally {
        conn.release();
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
}

addNotificationsTable();
