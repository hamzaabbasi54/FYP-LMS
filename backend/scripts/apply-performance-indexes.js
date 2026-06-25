import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'fyp_lms',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
});

const indexes = [
    ['users', 'idx_users_email_role_status', 'ALTER TABLE users ADD INDEX idx_users_email_role_status (email, role, status, is_active)'],
    ['users', 'idx_users_invite_token_expires', 'ALTER TABLE users ADD INDEX idx_users_invite_token_expires (invite_token, invite_expires)'],
    ['users', 'idx_users_reset_token_expires', 'ALTER TABLE users ADD INDEX idx_users_reset_token_expires (reset_token, reset_expires)'],
    ['users', 'idx_users_dept_role_status', 'ALTER TABLE users ADD INDEX idx_users_dept_role_status (department_id, role, status, is_active)'],
    ['users', 'idx_users_name_email', 'ALTER TABLE users ADD INDEX idx_users_name_email (full_name, email)'],
    ['students', 'idx_students_batch_active_name', 'ALTER TABLE students ADD INDEX idx_students_batch_active_name (batch_id, is_active, last_name, first_name)'],
    ['students', 'idx_students_name_lookup', 'ALTER TABLE students ADD INDEX idx_students_name_lookup (last_name, first_name, student_id_number)'],
    ['batches', 'idx_batches_dept_status_start', 'ALTER TABLE batches ADD INDEX idx_batches_dept_status_start (department_id, status, start_date)'],
    ['courses', 'idx_courses_dept_code_title', 'ALTER TABLE courses ADD INDEX idx_courses_dept_code_title (department_id, code, title)'],
    ['course_assignments', 'idx_ca_faculty_course_semester', 'ALTER TABLE course_assignments ADD INDEX idx_ca_faculty_course_semester (faculty_id, course_id, semester_id)'],
    ['course_assignments', 'idx_ca_semester_faculty', 'ALTER TABLE course_assignments ADD INDEX idx_ca_semester_faculty (semester_id, faculty_id)'],
    ['enrollments', 'idx_enroll_ca_student', 'ALTER TABLE enrollments ADD INDEX idx_enroll_ca_student (course_assignment_id, student_id)'],
    ['enrollments', 'idx_enroll_ca_created', 'ALTER TABLE enrollments ADD INDEX idx_enroll_ca_created (course_assignment_id, enrolled_at)'],
    ['attendance', 'idx_attend_ca_date_status', 'ALTER TABLE attendance ADD INDEX idx_attend_ca_date_status (course_assignment_id, date, status)'],
    ['attendance', 'idx_attend_ca_student_date', 'ALTER TABLE attendance ADD INDEX idx_attend_ca_student_date (course_assignment_id, student_id, date)'],
    ['assessments', 'idx_assess_ca_type_status_due', 'ALTER TABLE assessments ADD INDEX idx_assess_ca_type_status_due (course_assignment_id, type, status, due_date)'],
    ['grades', 'idx_grades_assessment_score', 'ALTER TABLE grades ADD INDEX idx_grades_assessment_score (assessment_id, score)'],
    ['question_grades', 'idx_qg_assessment_student', 'ALTER TABLE question_grades ADD INDEX idx_qg_assessment_student (assessment_id, student_id)'],
    ['messages', 'idx_msg_recipient_read_created', 'ALTER TABLE messages ADD INDEX idx_msg_recipient_read_created (recipient_id, is_read, created_at)'],
    ['messages', 'idx_msg_dept_users_created', 'ALTER TABLE messages ADD INDEX idx_msg_dept_users_created (department_id, sender_id, recipient_id, created_at)'],
    ['notifications', 'idx_notifications_user_read_created', 'ALTER TABLE notifications ADD INDEX idx_notifications_user_read_created (user_id, is_read, created_at)']
];

const tableExists = async (tableName) => {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName]
    );
    return Number(rows[0].count) > 0;
};

const indexExists = async (tableName, indexName) => {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.statistics
         WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
        [tableName, indexName]
    );
    return Number(rows[0].count) > 0;
};

try {
    let added = 0;
    let skipped = 0;

    for (const [tableName, indexName, sql] of indexes) {
        if (!(await tableExists(tableName))) {
            console.log(`Skipping ${indexName}: table ${tableName} does not exist`);
            skipped += 1;
            continue;
        }

        if (await indexExists(tableName, indexName)) {
            console.log(`Skipping ${indexName}: already exists`);
            skipped += 1;
            continue;
        }

        await connection.query(sql);
        console.log(`Added ${indexName}`);
        added += 1;
    }

    console.log(`Performance indexes complete. Added: ${added}, skipped: ${skipped}`);
} finally {
    await connection.end();
}
