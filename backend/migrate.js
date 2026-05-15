import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Checking migration system...');
        
        // 1. Create the tracking table if it doesn't exist
        await conn.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Ensure migrations directory exists
        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir);
            console.log(`Created migrations directory at ${migrationsDir}`);
        }

        // 3. Get all .sql files in the migrations directory
        const files = fs.readdirSync(migrationsDir)
                        .filter(f => f.endsWith('.sql'))
                        .sort();
        
        if (files.length === 0) {
            console.log('No migration files found in /migrations directory.');
            return;
        }

        // 4. Get already executed migrations
        const [executed] = await conn.query('SELECT migration_name FROM schema_migrations');
        const executedNames = executed.map(row => row.migration_name);

        // --- SPECIAL SAFETY CHECK ---
        // If the database already has tables (like users) but the schema_migrations
        // table is empty, we assume the initial schema is already applied.
        // This prevents '001_initial_schema.sql' from dropping existing data.
        const [tables] = await conn.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        const criticalTables = ['users', 'departments', 'faculties'];
        const hasExistingTables = criticalTables.some(t => tableNames.includes(t)); 
        
        if (hasExistingTables && executedNames.length === 0 && files.includes('001_initial_schema.sql')) {
            console.log('Detecting existing database... Marking initial schema as already applied to protect data.');
            await conn.query('INSERT INTO schema_migrations (migration_name) VALUES (?)', ['001_initial_schema.sql']);
            executedNames.push('001_initial_schema.sql');
        }
        // ----------------------------

        // 5. Find pending migrations
        const pending = files.filter(f => !executedNames.includes(f));

        if (pending.length === 0) {
            console.log('✅ Database is up to date! No new migrations to run.');
            return;
        }

        console.log(`Found ${pending.length} new migrations to execute.`);

        // 6. Execute pending migrations one by one
        for (const file of pending) {
            console.log(`\n⏳ Executing: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            // Disable foreign key checks during migration execution for safety
            await conn.query('SET FOREIGN_KEY_CHECKS = 0');
            
            // Execute the entire file as a single query using multipleStatements
            if (sql.trim()) {
                await conn.query(sql);
            }

            // Record it as executed
            await conn.query('INSERT INTO schema_migrations (migration_name) VALUES (?)', [file]);
            console.log(`✅ Successfully applied: ${file}`);
            
            await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        console.log('\n🎉 All migrations completed successfully!');

    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        if (conn) {
            await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
            conn.release();
        }
        process.exit(1);
    } finally {
        if (conn) {
            await conn.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
            conn.release();
        }
    }

    process.exit(0);
}

migrate();
