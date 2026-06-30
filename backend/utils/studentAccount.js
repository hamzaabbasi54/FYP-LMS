// ============================================
// Student account helpers (mobile app auth)
// Username = student email | Password = email ke last 5 digits (warna roll number)
// ============================================

import bcrypt from 'bcrypt';
import pool from '../config/db.js';

/**
 * Default password:
 * 1) email ke andar jo digits hon unke last 5
 * 2) warna roll number (student_id_number) ke last 5 characters
 */
export function defaultPasswordFromEmail(email, rollNumber = '') {
    const digits = String(email || '').replace(/\D/g, '');
    if (digits) {
        return digits.length <= 5 ? digits : digits.slice(-5);
    }
    const roll = String(rollNumber || '').trim();
    if (!roll) {
        throw new Error('Student email or roll number required for default password');
    }
    return roll.length <= 5 ? roll : roll.slice(-5);
}

export async function hashStudentPassword(plainPassword) {
    return bcrypt.hash(plainPassword, 10);
}

/**
 * Create or refresh a student_accounts row after student insert/import.
 * Login username = email. Auto-generated account id in student_accounts table.
 */
export async function ensureStudentAccount(conn, studentId, email, rollNumber = null) {
    const normalizedEmail = String(email).toLowerCase().trim();

    let roll = rollNumber;
    if (!roll) {
        const [[row]] = await conn.query(
            'SELECT student_id_number FROM students WHERE id = ?',
            [studentId]
        );
        roll = row?.student_id_number;
    }

    const plainPassword = defaultPasswordFromEmail(normalizedEmail, roll);
    const hashed = await hashStudentPassword(plainPassword);

    await conn.query(
        `INSERT INTO student_accounts (student_id, email, password)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            password = IF(student_accounts.password = '', VALUES(password), student_accounts.password),
            updated_at = CURRENT_TIMESTAMP`,
        [studentId, normalizedEmail, hashed]
    );

    return { email: normalizedEmail, defaultPassword: plainPassword };
}

/** Build profile JSON for mobile app — scoped to one student only */
export async function fetchStudentProfile(studentId) {
    const [[row]] = await pool.query(
        `SELECT s.id, s.student_id_number, s.first_name, s.last_name, s.email, s.cgpa,
                b.name AS batch_name, d.name AS department_name,
                (SELECT sem.name FROM semesters sem
                 JOIN course_assignments ca ON ca.semester_id = sem.id
                 JOIN enrollments e ON e.course_assignment_id = ca.id
                 WHERE e.student_id = s.id
                 ORDER BY sem.semester_number DESC LIMIT 1) AS semester_name
         FROM students s
         JOIN batches b ON s.batch_id = b.id
         JOIN departments d ON b.department_id = d.id
         WHERE s.id = ? AND s.is_active = TRUE`,
        [studentId]
    );

    if (!row) return null;

    return {
        id: String(row.id),
        name: `${row.first_name} ${row.last_name}`.trim(),
        email: row.email,
        registration_number: row.student_id_number,
        department: row.department_name,
        semester: row.semester_name || row.batch_name,
        program: row.batch_name,
        cgpa: row.cgpa != null ? Number(row.cgpa) : null,
    };
}

export async function assertStudentEnrolled(studentId, courseAssignmentId) {
    const [[row]] = await pool.query(
        `SELECT id FROM enrollments
         WHERE student_id = ? AND course_assignment_id = ?`,
        [studentId, courseAssignmentId]
    );
    return Boolean(row);
}

export function letterGradeFromPercentage(pct) {
    if (pct == null || Number.isNaN(pct)) return null;
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
}
