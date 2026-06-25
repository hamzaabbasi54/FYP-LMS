import 'dotenv/config';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const QA_PASSWORD = process.env.QA_PASSWORD || 'QaTest123!';
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'fyp_lms',
    multipleStatements: true
};

const pad = (value, len = 3) => String(value).padStart(len, '0');
const pick = (items, index) => items[index % items.length];
const dateAdd = (base, days) => {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};

async function chunkInsert(conn, sql, rows, size = 1000) {
    for (let i = 0; i < rows.length; i += size) {
        await conn.query(sql, [rows.slice(i, i + size)]);
    }
}

async function ensureSchema(conn) {
    const [tokenVersion] = await conn.query("SHOW COLUMNS FROM users LIKE 'token_version'");
    if (tokenVersion.length === 0) {
        await conn.query('ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER is_active');
        console.log('Added missing users.token_version column used by auth sessions.');
    }

    await conn.query(`
        CREATE TABLE IF NOT EXISTS clo_plo_mapping (
            clo_id INT NOT NULL,
            plo_id INT NOT NULL,
            PRIMARY KEY (clo_id, plo_id),
            INDEX idx_cpm_plo (plo_id),
            CONSTRAINT fk_cpm_clo FOREIGN KEY (clo_id) REFERENCES clos(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_cpm_plo FOREIGN KEY (plo_id) REFERENCES plos(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT NOT NULL,
            recipient_id INT NOT NULL,
            department_id INT NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_msg_sender (sender_id),
            INDEX idx_msg_recipient (recipient_id),
            INDEX idx_msg_department (department_id),
            INDEX idx_msg_read (is_read),
            INDEX idx_msg_created (created_at),
            INDEX idx_msg_conversation (sender_id, recipient_id, created_at),
            CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_msg_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_msg_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS course_assignment_files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_assignment_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_type VARCHAR(100) DEFAULT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_caf_assignment (course_assignment_id),
            CONSTRAINT fk_caf_assignment FOREIGN KEY (course_assignment_id) REFERENCES course_assignments(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}

async function cleanupQaData(conn) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    const deletes = [
        "DELETE FROM messages WHERE content LIKE '[QA]%' OR sender_id IN (SELECT id FROM users WHERE email LIKE 'qa.%@campusflow.test') OR recipient_id IN (SELECT id FROM users WHERE email LIKE 'qa.%@campusflow.test')",
        "DELETE qg FROM question_grades qg JOIN assessments a ON qg.assessment_id = a.id WHERE a.title LIKE 'QA %'",
        "DELETE aq FROM assessment_questions aq JOIN assessments a ON aq.assessment_id = a.id WHERE a.title LIKE 'QA %'",
        "DELETE acm FROM assessment_clo_mapping acm JOIN assessments a ON acm.assessment_id = a.id WHERE a.title LIKE 'QA %'",
        "DELETE g FROM grades g JOIN assessments a ON g.assessment_id = a.id WHERE a.title LIKE 'QA %'",
        "DELETE FROM assessments WHERE title LIKE 'QA %'",
        "DELETE a FROM attendance a JOIN course_assignments ca ON a.course_assignment_id = ca.id JOIN courses c ON ca.course_id = c.id WHERE c.code LIKE 'QA-%'",
        "DELETE e FROM enrollments e JOIN course_assignments ca ON e.course_assignment_id = ca.id JOIN courses c ON ca.course_id = c.id WHERE c.code LIKE 'QA-%'",
        "DELETE caf FROM course_assignment_files caf JOIN course_assignments ca ON caf.course_assignment_id = ca.id JOIN courses c ON ca.course_id = c.id WHERE c.code LIKE 'QA-%'",
        "DELETE ca FROM course_assignments ca JOIN courses c ON ca.course_id = c.id WHERE c.code LIKE 'QA-%'",
        "DELETE FROM course_clo_mapping WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'QA-%') OR clo_id IN (SELECT id FROM clos WHERE title LIKE 'QA CLO %')",
        "DELETE FROM clo_plo_mapping WHERE clo_id IN (SELECT id FROM clos WHERE title LIKE 'QA CLO %') OR plo_id IN (SELECT id FROM plos WHERE description LIKE 'QA PLO %')",
        "DELETE FROM batch_clo_plo_mapping WHERE batch_id IN (SELECT id FROM batches WHERE name LIKE 'QA Batch %') OR clo_id IN (SELECT id FROM clos WHERE title LIKE 'QA CLO %')",
        "DELETE FROM batch_plos WHERE batch_id IN (SELECT id FROM batches WHERE name LIKE 'QA Batch %') OR plo_id IN (SELECT id FROM plos WHERE description LIKE 'QA PLO %')",
        "DELETE FROM clos WHERE title LIKE 'QA CLO %'",
        "DELETE FROM syllabi WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'QA-%')",
        "DELETE FROM course_prerequisites WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'QA-%') OR prerequisite_course_id IN (SELECT id FROM courses WHERE code LIKE 'QA-%')",
        "DELETE FROM curriculum_semester_courses WHERE course_id IN (SELECT id FROM courses WHERE code LIKE 'QA-%') OR curriculum_semester_id IN (SELECT cs.id FROM curriculum_semesters cs JOIN curricula c ON cs.curriculum_id = c.id WHERE c.name LIKE 'QA Curriculum %')",
        "DELETE FROM courses WHERE code LIKE 'QA-%'",
        "DELETE FROM curriculum_semesters WHERE curriculum_id IN (SELECT id FROM curricula WHERE name LIKE 'QA Curriculum %')",
        "DELETE FROM curricula WHERE name LIKE 'QA Curriculum %'",
        "DELETE FROM parents WHERE email LIKE 'qa.parent.%@campusflow.test'",
        "DELETE FROM students WHERE student_id_number LIKE 'QASTU-%'",
        "DELETE FROM semesters WHERE batch_id IN (SELECT id FROM batches WHERE name LIKE 'QA Batch %')",
        "DELETE FROM batches WHERE name LIKE 'QA Batch %'",
        "DELETE FROM plos WHERE description LIKE 'QA PLO %'",
        "DELETE FROM users WHERE email LIKE 'qa.%@campusflow.test'",
        "DELETE FROM departments WHERE name LIKE 'QA Department %'",
        "DELETE FROM faculties WHERE name = 'QA Faculty of Technology'"
    ];

    for (const sql of deletes) {
        try {
            await conn.query(sql);
        } catch (error) {
            console.warn(`Cleanup skipped one step: ${error.message}`);
        }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function main() {
    const startedAt = Date.now();
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
        await ensureSchema(conn);
        await cleanupQaData(conn);

        const passwordHash = await bcrypt.hash(QA_PASSWORD, 10);
        await conn.query("INSERT INTO faculties (name) VALUES ('QA Faculty of Technology')");
        const [[qaFaculty]] = await conn.query("SELECT id FROM faculties WHERE name = 'QA Faculty of Technology'");
        const facultyId = qaFaculty.id;

        const departments = Array.from({ length: 10 }, (_, i) => [
            `QA Department ${pad(i + 1, 2)}`,
            facultyId
        ]);
        await chunkInsert(conn, 'INSERT INTO departments (name, faculty_id) VALUES ?', departments);
        const [departmentRows] = await conn.query("SELECT id, name FROM departments WHERE name LIKE 'QA Department %' ORDER BY name");

        const users = [
            ['QA Super Admin', 'qa.superadmin@campusflow.test', passwordHash, 'super_admin', null, null, '0300-0000000', 'approved', true, 0]
        ];

        departmentRows.forEach((dept, i) => {
            users.push([
                `QA Department Admin ${pad(i + 1, 2)}`,
                `qa.deptadmin${pad(i + 1, 2)}@campusflow.test`,
                passwordHash,
                'deptadmin',
                facultyId,
                dept.id,
                `0301-${pad(i + 1, 7)}`,
                'approved',
                true,
                0
            ]);
        });

        for (let i = 0; i < 200; i++) {
            const dept = departmentRows[i % departmentRows.length];
            users.push([
                `QA Faculty ${pad(i + 1)}`,
                `qa.faculty${pad(i + 1)}@campusflow.test`,
                passwordHash,
                'faculty',
                facultyId,
                dept.id,
                `0310-${pad(i + 1, 7)}`,
                'approved',
                true,
                0
            ]);
        }

        await chunkInsert(
            conn,
            'INSERT INTO users (full_name, email, password, role, faculty_id, department_id, phone_number, status, is_active, token_version) VALUES ?',
            users,
            500
        );

        const [facultyUsers] = await conn.query("SELECT id, department_id FROM users WHERE email LIKE 'qa.faculty%@campusflow.test' ORDER BY email");
        const [deptAdmins] = await conn.query("SELECT id, department_id FROM users WHERE email LIKE 'qa.deptadmin%@campusflow.test' ORDER BY email");

        const curricula = departmentRows.map((dept, i) => [
            `QA Curriculum ${pad(i + 1, 2)}`,
            dept.id,
            `QA curriculum for production-size testing of ${dept.name}.`,
            8,
            'active'
        ]);
        await chunkInsert(conn, 'INSERT INTO curricula (name, department_id, description, total_semesters, status) VALUES ?', curricula);
        const [curriculumRows] = await conn.query("SELECT id, department_id FROM curricula WHERE name LIKE 'QA Curriculum %' ORDER BY name");

        const batches = [];
        for (const [i, dept] of departmentRows.entries()) {
            const curriculum = curriculumRows.find((row) => row.department_id === dept.id);
            batches.push([`QA Batch ${pad(i + 1, 2)} A`, dept.id, curriculum.id, '2023-08-01', '2027-06-30', 'active', true]);
            batches.push([`QA Batch ${pad(i + 1, 2)} B`, dept.id, curriculum.id, '2024-08-01', '2028-06-30', 'active', true]);
        }
        await chunkInsert(conn, 'INSERT INTO batches (name, department_id, curriculum_id, start_date, end_date, status, is_active) VALUES ?', batches);
        const [batchRows] = await conn.query("SELECT id, name, department_id, curriculum_id FROM batches WHERE name LIKE 'QA Batch %' ORDER BY name");

        const semesters = [];
        for (const batch of batchRows) {
            for (let s = 1; s <= 8; s++) {
                semesters.push([batch.id, `Semester ${s}`, s, s % 2 ? `Fall ${2022 + Math.ceil(s / 2)}` : `Spring ${2023 + Math.ceil(s / 2)}`, dateAdd('2026-01-01', s * 30), dateAdd('2026-01-01', s * 30 + 110)]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO semesters (batch_id, name, semester_number, term, start_date, end_date) VALUES ?', semesters, 1000);
        const [semesterRows] = await conn.query("SELECT s.id, s.batch_id, s.semester_number, b.department_id FROM semesters s JOIN batches b ON s.batch_id = b.id WHERE b.name LIKE 'QA Batch %' ORDER BY s.id");

        const curriculumSemesters = [];
        for (const curriculum of curriculumRows) {
            for (let s = 1; s <= 8; s++) {
                curriculumSemesters.push([curriculum.id, s, `Semester ${s}`]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO curriculum_semesters (curriculum_id, semester_number, name) VALUES ?', curriculumSemesters, 1000);
        const [curriculumSemesterRows] = await conn.query("SELECT cs.id, cs.curriculum_id, cs.semester_number, c.department_id FROM curriculum_semesters cs JOIN curricula c ON cs.curriculum_id = c.id WHERE c.name LIKE 'QA Curriculum %'");

        const courses = [];
        const courseTitles = ['Programming Fundamentals', 'Database Systems', 'Software Engineering', 'Web Engineering', 'Data Structures', 'Computer Networks', 'Operating Systems', 'Artificial Intelligence', 'Information Security', 'Human Computer Interaction'];
        for (const [deptIndex, dept] of departmentRows.entries()) {
            for (let i = 1; i <= 50; i++) {
                courses.push([
                    `QA ${pick(courseTitles, i)} ${pad(deptIndex + 1, 2)}-${pad(i)}`,
                    `QA-D${pad(deptIndex + 1, 2)}-C${pad(i)}`,
                    dept.id,
                    (i % 2) + 3,
                    ((i - 1) % 8) + 1,
                    '',
                    `QA course used for production load testing in ${dept.name}.`
                ]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO courses (title, code, department_id, credit_hours, semester_level, prerequisites, description) VALUES ?', courses, 1000);
        const [courseRows] = await conn.query("SELECT id, code, department_id, semester_level FROM courses WHERE code LIKE 'QA-%' ORDER BY code");

        const plos = [];
        for (const dept of departmentRows) {
            for (let i = 1; i <= 4; i++) {
                plos.push([dept.id, i, `QA PLO ${i}: Demonstrate academic and professional competency for ${dept.name}.`, 'active']);
            }
        }
        await chunkInsert(conn, 'INSERT INTO plos (department_id, plo_number, description, status) VALUES ?', plos);
        const [ploRows] = await conn.query("SELECT id, department_id, plo_number FROM plos WHERE description LIKE 'QA PLO %' ORDER BY id");

        const batchPlos = [];
        for (const batch of batchRows) {
            ploRows.filter((plo) => plo.department_id === batch.department_id).forEach((plo) => {
                batchPlos.push([batch.id, plo.id]);
            });
        }
        await chunkInsert(conn, 'INSERT INTO batch_plos (batch_id, plo_id) VALUES ?', batchPlos, 1000);

        const clos = [];
        for (const course of courseRows) {
            for (let i = 1; i <= 2; i++) {
                clos.push([course.id, i, `QA CLO ${course.code}-${i}`, `Evaluate learning outcome ${i} for ${course.code}.`, pick(['C2', 'C3', 'C4'], i)]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO clos (course_id, clo_number, title, description, cognitive_level) VALUES ?', clos, 1000);
        const [cloRows] = await conn.query("SELECT id, course_id FROM clos WHERE title LIKE 'QA CLO %' ORDER BY id");
        const courseCloMappings = cloRows.map((clo) => [clo.course_id, clo.id]);
        await chunkInsert(conn, 'INSERT INTO course_clo_mapping (course_id, clo_id) VALUES ?', courseCloMappings, 1000);

        const globalCloPloMappings = [];
        for (const clo of cloRows) {
            const course = courseRows.find((row) => row.id === clo.course_id);
            const deptPlos = ploRows.filter((plo) => plo.department_id === course?.department_id);
            if (deptPlos.length > 0) {
                globalCloPloMappings.push([clo.id, pick(deptPlos, clo.id).id]);
            }
        }
        await chunkInsert(conn, 'INSERT IGNORE INTO clo_plo_mapping (clo_id, plo_id) VALUES ?', globalCloPloMappings, 1000);

        const assignments = [];
        for (const course of courseRows) {
            const semester = semesterRows.find((row) => row.department_id === course.department_id && row.semester_number === course.semester_level) || semesterRows.find((row) => row.department_id === course.department_id);
            const facultyPool = facultyUsers.filter((user) => user.department_id === course.department_id);
            assignments.push([course.id, semester.id, pick(facultyPool, course.id).id]);
        }
        await chunkInsert(conn, 'INSERT INTO course_assignments (course_id, semester_id, faculty_id) VALUES ?', assignments, 1000);
        const [assignmentRows] = await conn.query("SELECT ca.id, ca.course_id, ca.semester_id, ca.faculty_id, c.department_id, c.semester_level, s.batch_id FROM course_assignments ca JOIN courses c ON ca.course_id = c.id JOIN semesters s ON ca.semester_id = s.id WHERE c.code LIKE 'QA-%' ORDER BY ca.id");

        const curriculumCourseRows = [];
        for (const course of courseRows) {
            const cs = curriculumSemesterRows.find((row) => row.department_id === course.department_id && row.semester_number === course.semester_level);
            if (cs) curriculumCourseRows.push([cs.id, course.id]);
        }
        await chunkInsert(conn, 'INSERT IGNORE INTO curriculum_semester_courses (curriculum_semester_id, course_id) VALUES ?', curriculumCourseRows, 1000);

        const batchCloPloMappings = [];
        for (const assignment of assignmentRows) {
            const courseClos = cloRows.filter((clo) => clo.course_id === assignment.course_id);
            const deptPlos = ploRows.filter((plo) => plo.department_id === assignment.department_id);
            courseClos.forEach((clo, i) => batchCloPloMappings.push([assignment.batch_id, clo.id, pick(deptPlos, i).id]));
        }
        await chunkInsert(conn, 'INSERT IGNORE INTO batch_clo_plo_mapping (batch_id, clo_id, plo_id) VALUES ?', batchCloPloMappings, 1000);

        const firstNames = ['Ahmed', 'Laiba', 'Mehwish', 'Ayesha', 'Ali', 'Hassan', 'Fatima', 'Zainab', 'Bilal', 'Mariam'];
        const lastNames = ['Khan', 'Ahmed', 'Malik', 'Raza', 'Sheikh', 'Nawaz', 'Iqbal', 'Akram', 'Butt', 'Shah'];
        const students = [];
        for (const [deptIndex, dept] of departmentRows.entries()) {
            const deptBatches = batchRows.filter((batch) => batch.department_id === dept.id);
            for (let i = 1; i <= 500; i++) {
                students.push([
                    `QASTU-D${pad(deptIndex + 1, 2)}-${pad(i, 4)}`,
                    pick(firstNames, i),
                    pick(lastNames, i + deptIndex),
                    `qa.student.d${pad(deptIndex + 1, 2)}.${pad(i, 4)}@campusflow.test`,
                    `0320-${pad(deptIndex + 1, 2)}${pad(i, 5)}`,
                    pick(deptBatches, i).id,
                    (2.2 + ((i % 18) / 10)).toFixed(2),
                    true,
                    850 + (i % 150),
                    820 + (i % 170),
                    pick(['pre-engineering', 'ics', 'pre-med', 'other'], i)
                ]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO students (student_id_number, first_name, last_name, email, phone, batch_id, cgpa, is_active, matric_marks, fsc_marks, background) VALUES ?', students, 1000);
        const [studentRows] = await conn.query("SELECT s.id, s.batch_id, b.department_id FROM students s JOIN batches b ON s.batch_id = b.id WHERE s.student_id_number LIKE 'QASTU-%' ORDER BY s.id");

        const parents = studentRows.map((student, i) => [
            student.id,
            `QA Parent ${pad(i + 1, 4)}`,
            `qa.parent.${pad(i + 1, 4)}@campusflow.test`,
            `0330-${pad(i + 1, 7)}`
        ]);
        await chunkInsert(conn, 'INSERT INTO parents (student_id, name, email, phone) VALUES ?', parents, 1000);

        const enrollments = [];
        for (const assignment of assignmentRows) {
            const eligible = studentRows.filter((student) => student.batch_id === assignment.batch_id);
            for (let i = 0; i < Math.min(50, eligible.length); i++) {
                enrollments.push([eligible[i].id, assignment.id]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO enrollments (student_id, course_assignment_id) VALUES ?', enrollments, 1000);

        const attendanceDates = ['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22'];
        const attendance = [];
        for (const [i, enrollment] of enrollments.entries()) {
            for (const [d, date] of attendanceDates.entries()) {
                attendance.push([
                    enrollment[1],
                    enrollment[0],
                    date,
                    (i + d) % 17 === 0 ? 'absent' : ((i + d) % 11 === 0 ? 'late' : 'present'),
                    ''
                ]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO attendance (course_assignment_id, student_id, date, status, remarks) VALUES ?', attendance, 2000);

        const assessments = [];
        for (const assignment of assignmentRows) {
            assessments.push([assignment.id, 'quiz', `QA Quiz ${assignment.id}`, 'QA quiz for load testing.', '2026-06-12 10:00:00', '2026-06-12 10:00:00', '2026-06-14 10:00:00', 20, 10, 30, 'graded']);
            assessments.push([assignment.id, 'assignment', `QA Assignment ${assignment.id}`, 'QA assignment for load testing.', '2026-06-20 10:00:00', '2026-06-20 10:00:00', '2026-06-23 10:00:00', 30, 15, null, 'graded']);
        }
        await chunkInsert(conn, 'INSERT INTO assessments (course_assignment_id, type, title, description, due_date, conducted_date, release_grades_on, max_score, weight, duration_minutes, status) VALUES ?', assessments, 1000);
        const [assessmentRows] = await conn.query("SELECT id, course_assignment_id, max_score FROM assessments WHERE title LIKE 'QA %' ORDER BY id");

        const assessmentMappings = [];
        const questions = [];
        for (const assessment of assessmentRows) {
            const assignment = assignmentRows.find((row) => row.id === assessment.course_assignment_id);
            const courseClos = cloRows.filter((clo) => clo.course_id === assignment.course_id);
            courseClos.forEach((clo) => assessmentMappings.push([assessment.id, clo.id]));
            questions.push([assessment.id, 1, 'QA conceptual question', assessment.max_score / 2, 50, courseClos[0]?.id || null]);
            questions.push([assessment.id, 2, 'QA applied question', assessment.max_score / 2, 50, courseClos[1]?.id || courseClos[0]?.id || null]);
        }
        await chunkInsert(conn, 'INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES ?', assessmentMappings, 1000);
        await chunkInsert(conn, 'INSERT INTO assessment_questions (assessment_id, question_number, description, max_marks, weightage, clo_id) VALUES ?', questions, 1000);

        const grades = [];
        for (const assessment of assessmentRows) {
            const enrolled = enrollments.filter((enrollment) => enrollment[1] === assessmentRows.find((row) => row.id === assessment.id)?.course_assignment_id);
            for (const [i, enrollment] of enrolled.entries()) {
                grades.push([
                    assessment.id,
                    enrollment[0],
                    Math.max(0, assessment.max_score - (i % 9)).toFixed(2),
                    i % 13 === 0 ? 'Needs improvement' : 'Satisfactory',
                    assignmentRows.find((row) => row.id === assessment.course_assignment_id)?.faculty_id || null,
                    '2026-06-24 10:00:00'
                ]);
            }
        }
        await chunkInsert(conn, 'INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at) VALUES ?', grades, 2000);

        const messages = [];
        for (const [i, admin] of deptAdmins.entries()) {
            const deptFaculty = facultyUsers.filter((user) => user.department_id === admin.department_id).slice(0, 8);
            deptFaculty.forEach((faculty, j) => {
                messages.push([admin.id, faculty.id, admin.department_id, `[QA] Please review attendance and grading workflow ${j + 1}.`, j % 2 === 0]);
                messages.push([faculty.id, admin.id, admin.department_id, `[QA] Faculty response for department ${i + 1}.`, j % 2 !== 0]);
            });
        }
        await chunkInsert(conn, 'INSERT INTO messages (sender_id, recipient_id, department_id, content, is_read) VALUES ?', messages, 1000);

        const [[counts]] = await conn.query(`
            SELECT
                (SELECT COUNT(*) FROM departments WHERE name LIKE 'QA Department %') departments,
                (SELECT COUNT(*) FROM users WHERE email LIKE 'qa.faculty%@campusflow.test') faculty,
                (SELECT COUNT(*) FROM students WHERE student_id_number LIKE 'QASTU-%') students,
                (SELECT COUNT(*) FROM courses WHERE code LIKE 'QA-%') courses,
                (SELECT COUNT(*) FROM attendance a JOIN course_assignments ca ON a.course_assignment_id = ca.id JOIN courses c ON ca.course_id = c.id WHERE c.code LIKE 'QA-%') attendance_records,
                (SELECT COUNT(*) FROM grades g JOIN assessments a ON g.assessment_id = a.id WHERE a.title LIKE 'QA %') grade_records,
                (SELECT COUNT(*) FROM messages WHERE content LIKE '[QA]%') messages
        `);

        console.log(JSON.stringify({
            success: true,
            password: QA_PASSWORD,
            duration_seconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
            counts
        }, null, 2));
    } finally {
        await conn.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
