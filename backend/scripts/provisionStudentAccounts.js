/**
 * One-time / maintenance: create student_accounts for all active students.
 * Username = email | Password = last 5 digits in email
 */
import 'dotenv/config';
import { pool } from '../config/db.js';
import { ensureStudentAccount } from '../utils/studentAccount.js';

async function main() {
    const [students] = await pool.query(
        `SELECT id, email, student_id_number
         FROM students
         WHERE is_active = TRUE
         ORDER BY id`
    );

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const student of students) {
        try {
            await ensureStudentAccount(pool, student.id, student.email, student.student_id_number);
            created++;
        } catch (err) {
            skipped++;
            errors.push({ id: student.id, email: student.email, error: err.message });
        }
    }

    const [[count]] = await pool.query('SELECT COUNT(*) AS c FROM student_accounts');
    console.log(`✅ Provisioned ${created} student accounts (${skipped} skipped)`);
    console.log(`📊 Total student_accounts rows: ${count.c}`);
    if (errors.length > 0) {
        console.log('\nSkipped (no digits in email — fix email or add student again):');
        errors.slice(0, 10).forEach((e) => console.log(`  - id ${e.id}: ${e.email}`));
        if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`);
    }
    process.exit(0);
}

main().catch((err) => {
    console.error('Provision failed:', err);
    process.exit(1);
});
