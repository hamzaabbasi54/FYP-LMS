import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from './config/db.js';

async function wipeAndSeed() {
    const conn = await pool.getConnection();
    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');

        // Get all table names
        const [tables] = await conn.query(
            `SELECT table_name FROM information_schema.tables 
             WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`
        );

        // Truncate each table
        for (const row of tables) {
            const tableName = row.TABLE_NAME || row.table_name;
            console.log(`  Truncating ${tableName}...`);
            await conn.query(`TRUNCATE TABLE \`${tableName}\``);
        }

        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n✅ All data wiped.\n');

        // Re-seed faculties & departments
        console.log('🌱 Re-seeding faculties & departments...');

        const facultiesData = [
            { name: 'Faculty of Natural Sciences', departments: [
                'Department of Chemistry', 'Department of Computer Sciences', 'Department of Earth Sciences',
                'Department of Electronics', 'Department of Mathematics', 'Department of Physics',
                'Department of Statistics', 'Institute of Information Technology'
            ]},
            { name: 'Faculty of Biological Sciences', departments: [
                'Department of Animal Sciences (Zoology)', 'Department of Biochemistry',
                'Department of Biotechnology', 'Department of Environmental Sciences',
                'Department of Microbiology', 'Department of Pharmacy',
                'Department of Plant Sciences', 'National Centre for Bioinformatics'
            ]},
            { name: 'Faculty of Social Sciences', departments: [
                'Department of Anthropology', 'Department of Defence & Strategic Studies (DSS)',
                'Department of English / Linguistics', 'Department of History',
                'School of Economics', 'School of Law', 'School of Politics & International Relations',
                'Department of Psychology', 'Department of Sociology',
                'Area Study Center for Africa, North & South America',
                'Area Study Center for Europe',
                'Department of Governance and Public Policy',
                'Institute of Administrative Sciences',
                'National Institute of Pakistan Studies (NIPS)'
            ]}
        ];

        for (const fac of facultiesData) {
            const [facResult] = await conn.query('INSERT INTO faculties (name) VALUES (?)', [fac.name]);
            const facultyId = facResult.insertId;
            for (const dept of fac.departments) {
                await conn.query('INSERT INTO departments (name, faculty_id) VALUES (?, ?)', [dept, facultyId]);
            }
            console.log(`  ✓ ${fac.name} (${fac.departments.length} departments)`);
        }

        // Create super admin account
        console.log('\n👤 Creating super admin account...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await conn.query(
            `INSERT INTO users (full_name, email, password, role, status, is_active) 
             VALUES (?, ?, ?, 'super_admin', 'approved', true)`,
            ['Super Admin', 'admin@gmail.com', hashedPassword]
        );

        console.log('  ✓ Super Admin created:');
        console.log('    Email:    admin@gmail.com');
        console.log('    Password: admin123');
        console.log('\n🎉 Database reset complete! You have a fresh start.\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

wipeAndSeed();
