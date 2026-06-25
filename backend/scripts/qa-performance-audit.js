import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import mysql from 'mysql2/promise';

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000/api';
const QA_PASSWORD = process.env.QA_PASSWORD || 'QaTest123!';
const OUT_DIR = path.resolve('qa-results');
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'fyp_lms'
};

const accounts = {
    superAdmin: { email: 'qa.superadmin@campusflow.test', password: QA_PASSWORD, role: 'super_admin' },
    deptAdmin: { email: 'qa.deptadmin01@campusflow.test', password: QA_PASSWORD, role: 'deptadmin' },
    faculty: { email: 'qa.faculty001@campusflow.test', password: QA_PASSWORD, role: 'faculty' }
};

async function request(method, url, { body, cookie } = {}) {
    const started = performance.now();
    const response = await fetch(`${BASE_URL}${url}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const durationMs = performance.now() - started;
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    return {
        method,
        url,
        status: response.status,
        ok: response.ok,
        duration_ms: Number(durationMs.toFixed(2)),
        cookie: response.headers.get('set-cookie')?.split(';')[0],
        data
    };
}

async function login(account) {
    return request('POST', '/auth/login', { body: account });
}

function metricSeverity(durationMs, ok) {
    if (!ok) return 'High';
    if (durationMs > 2000) return 'High';
    if (durationMs > 1000) return 'Medium';
    if (durationMs > 500) return 'Low';
    return 'Pass';
}

async function timedQuery(conn, label, sql, params = []) {
    const started = performance.now();
    const [rows] = await conn.query(sql, params);
    return {
        label,
        duration_ms: Number((performance.now() - started).toFixed(2)),
        rows: Array.isArray(rows) ? rows.length : 0
    };
}

async function main() {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const conn = await mysql.createConnection(DB_CONFIG);
    const report = {
        generated_at: new Date().toISOString(),
        base_url: BASE_URL,
        dataset: {},
        api_tests: [],
        db_query_tests: [],
        findings: [],
        memory: {}
    };

    const [[dataset]] = await conn.query(`
        SELECT
            (SELECT COUNT(*) FROM departments) departments,
            (SELECT COUNT(*) FROM users WHERE role='super_admin') super_admins,
            (SELECT COUNT(*) FROM users WHERE role='deptadmin') dept_admins,
            (SELECT COUNT(*) FROM users WHERE role='faculty') faculty,
            (SELECT COUNT(*) FROM students) students,
            (SELECT COUNT(*) FROM courses) courses,
            (SELECT COUNT(*) FROM batches) batches,
            (SELECT COUNT(*) FROM attendance) attendance_records,
            (SELECT COUNT(*) FROM grades) grade_records,
            (SELECT COUNT(*) FROM assessments) assessments,
            (SELECT COUNT(*) FROM plos) plos,
            (SELECT COUNT(*) FROM clos) clos
    `);
    report.dataset = dataset;

    const [assignmentRows] = await conn.query(`
        SELECT ca.id, ca.faculty_id, c.code
        FROM course_assignments ca
        JOIN courses c ON c.id = ca.course_id
        JOIN users u ON u.id = ca.faculty_id
        WHERE c.code LIKE 'QA-%' AND u.email = 'qa.faculty001@campusflow.test'
        ORDER BY ca.id
        LIMIT 1
    `);
    const assignmentId = assignmentRows[0]?.id;

    const loginResults = {};
    for (const [key, account] of Object.entries(accounts)) {
        const result = await login(account);
        loginResults[key] = result;
        report.api_tests.push({
            name: `Login as ${key}`,
            method: result.method,
            url: result.url,
            status: result.status,
            duration_ms: result.duration_ms,
            severity: metricSeverity(result.duration_ms, result.ok)
        });
    }

    const superCookie = loginResults.superAdmin.cookie;
    const adminCookie = loginResults.deptAdmin.cookie;
    const facultyCookie = loginResults.faculty.cookie;

    const apiCases = [
        ['Super admin profile restore', 'GET', '/auth/me', superCookie],
        ['Department admin profile restore', 'GET', '/auth/me', adminCookie],
        ['Faculty profile restore', 'GET', '/auth/me', facultyCookie],
        ['Users list pagination/search', 'GET', '/auth/users?page=1&limit=25&search=qa', adminCookie],
        ['Batches pagination/search', 'GET', '/batches?page=1&limit=20&search=QA', adminCookie],
        ['Courses pagination/search', 'GET', '/courses?page=1&limit=20&search=QA', adminCookie],
        ['Curricula pagination/search', 'GET', '/curricula?page=1&limit=20&search=QA', adminCookie],
        ['Faculty messages contacts', 'GET', '/messages/contacts', facultyCookie],
        ['Faculty unread messages', 'GET', '/messages/unread-count', facultyCookie],
        ['Faculty assigned courses', 'GET', '/courses/assigned', facultyCookie],
        ['Faculty course attendance page', 'GET', assignmentId ? `/attendance/course/${assignmentId}?date=2026-06-22&page=1&limit=50` : '/attendance/course/0', facultyCookie],
        ['Faculty monthly attendance report', 'GET', assignmentId ? `/attendance/monthly/${assignmentId}?month=6&year=2026` : '/attendance/monthly/0?month=6&year=2026', facultyCookie],
        ['Faculty assessments for course', 'GET', assignmentId ? `/assessments/course/${assignmentId}?page=1&limit=20` : '/assessments/course/0', facultyCookie],
        ['Global CLO list', 'GET', '/courses/clos/all', adminCookie],
        ['Dashboard stats', 'GET', '/dashboard/stats', adminCookie],
        ['Dashboard attendance overview', 'GET', '/dashboard/attendance-overview', adminCookie],
        ['Dashboard grade distribution', 'GET', '/dashboard/grade-distribution', adminCookie]
    ];

    for (const [name, method, url, cookie] of apiCases) {
        const result = await request(method, url, { cookie });
        report.api_tests.push({
            name,
            method,
            url,
            status: result.status,
            duration_ms: result.duration_ms,
            severity: metricSeverity(result.duration_ms, result.ok),
            message: result.data?.message || undefined
        });
    }

    const saveBody = {
        date: '2026-06-29',
        records: []
    };
    if (assignmentId) {
        const [students] = await conn.query(
            'SELECT student_id FROM enrollments WHERE course_assignment_id = ? LIMIT 50',
            [assignmentId]
        );
        saveBody.records = students.map((student) => ({
            student_id: student.student_id,
            status: 'present',
            remarks: 'QA save test'
        }));
        const saveResult = await request('POST', `/attendance/course/${assignmentId}`, { cookie: facultyCookie, body: saveBody });
        report.api_tests.push({
            name: 'Save 50 attendance records',
            method: 'POST',
            url: `/attendance/course/${assignmentId}`,
            status: saveResult.status,
            duration_ms: saveResult.duration_ms,
            severity: metricSeverity(saveResult.duration_ms, saveResult.ok),
            message: saveResult.data?.message || undefined
        });
    }

    const dbQueries = [
        ['Login lookup by email', "SELECT * FROM users WHERE email = 'qa.faculty001@campusflow.test'"],
        ['Paginated students search', "SELECT s.id, s.first_name, s.last_name FROM students s WHERE s.student_id_number LIKE 'QASTU-%' ORDER BY s.last_name, s.first_name LIMIT 50"],
        ['Attendance date page', 'SELECT a.*, s.first_name, s.last_name FROM attendance a JOIN students s ON s.id = a.student_id WHERE a.course_assignment_id = ? AND a.date = ? ORDER BY s.last_name, s.first_name LIMIT 50', [assignmentId || 0, '2026-06-22']],
        ['Monthly attendance grid source', 'SELECT a.student_id, a.date, a.status FROM attendance a WHERE a.course_assignment_id = ? AND a.date >= ? AND a.date <= ?', [assignmentId || 0, '2026-06-01', '2026-06-30']],
        ['Dashboard departments count', 'SELECT d.name, COUNT(s.id) students FROM departments d LEFT JOIN batches b ON b.department_id = d.id LEFT JOIN students s ON s.batch_id = b.id GROUP BY d.id ORDER BY students DESC LIMIT 20']
    ];
    for (const [label, sql, params = []] of dbQueries) {
        report.db_query_tests.push(await timedQuery(conn, label, sql, params));
    }

    report.memory = process.memoryUsage();

    report.findings = [
        ...report.api_tests
            .filter((test) => test.severity !== 'Pass')
            .map((test) => ({
                severity: test.severity,
                area: 'API',
                issue: `${test.name} returned status ${test.status} in ${test.duration_ms}ms`,
                endpoint: `${test.method} ${test.url}`,
                message: test.message
            })),
        ...report.db_query_tests
            .filter((test) => test.duration_ms > 100)
            .map((test) => ({
                severity: test.duration_ms > 500 ? 'High' : 'Medium',
                area: 'Database',
                issue: `${test.label} took ${test.duration_ms}ms`,
                endpoint: test.label
            }))
    ];

    const jsonPath = path.join(OUT_DIR, `qa-performance-${Date.now()}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
    await conn.end();

    console.log(JSON.stringify({
        success: true,
        report: jsonPath,
        dataset: report.dataset,
        failed_or_slow: report.findings.length,
        api_tests: report.api_tests
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
