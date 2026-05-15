-- ============================================
-- File: backend/test_queries.sql
-- Phase 5 — Verification Queries
-- Run each query to verify data integrity
-- ============================================

-- =============================================
-- 1. DATA INTEGRITY CHECKS
-- =============================================

-- Check all tables have data
SELECT 'faculties' as tbl, COUNT(*) as count FROM faculties
UNION ALL SELECT 'departments', COUNT(*) FROM departments
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'batches', COUNT(*) FROM batches
UNION ALL SELECT 'plos', COUNT(*) FROM plos
UNION ALL SELECT 'semesters', COUNT(*) FROM semesters
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'clos', COUNT(*) FROM clos
UNION ALL SELECT 'syllabi', COUNT(*) FROM syllabi
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'parents', COUNT(*) FROM parents
UNION ALL SELECT 'course_assignments', COUNT(*) FROM course_assignments
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL SELECT 'grades', COUNT(*) FROM grades
UNION ALL SELECT 'attendance', COUNT(*) FROM attendance;

-- =============================================
-- 2. RELATIONSHIP INTEGRITY CHECKS
-- =============================================

-- All departments have valid faculties
SELECT d.name as department, f.name as faculty
FROM departments d
JOIN faculties f ON d.faculty_id = f.id
ORDER BY f.name, d.name;

-- All students belong to valid batches
SELECT s.student_id_number, s.first_name, s.last_name, b.name as batch
FROM students s
JOIN batches b ON s.batch_id = b.id;

-- All enrollments link valid students to valid course assignments
SELECT s.student_id_number, c.code as course, sem.name as semester
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN course_assignments ca ON e.course_assignment_id = ca.id
JOIN courses c ON ca.course_id = c.id
JOIN semesters sem ON ca.semester_id = sem.id;

-- =============================================
-- 3. DASHBOARD QUERIES (for Admin Graphs)
-- =============================================

-- Students per Department (BAR CHART)
SELECT d.name as department, COUNT(s.id) as student_count
FROM departments d
LEFT JOIN batches b ON b.department_id = d.id
LEFT JOIN students s ON s.batch_id = b.id
GROUP BY d.id, d.name
ORDER BY student_count DESC;

-- Enrollment Trends (LINE CHART — monthly)
SELECT DATE_FORMAT(enrolled_at, '%Y-%m') as month,
       COUNT(*) as enrollments
FROM enrollments
GROUP BY month
ORDER BY month;

-- Attendance Rate (PIE CHART)
SELECT status, COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance), 1) as percentage
FROM attendance
GROUP BY status;

-- Grade Distribution (HISTOGRAM)
SELECT
    CASE
        WHEN (g.score / a.max_score * 100) >= 90 THEN 'A (90-100%)'
        WHEN (g.score / a.max_score * 100) >= 80 THEN 'B (80-89%)'
        WHEN (g.score / a.max_score * 100) >= 70 THEN 'C (70-79%)'
        WHEN (g.score / a.max_score * 100) >= 60 THEN 'D (60-69%)'
        ELSE 'F (<60%)'
    END as grade_range,
    COUNT(*) as count
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
WHERE g.score IS NOT NULL
GROUP BY grade_range
ORDER BY grade_range;

-- Faculty Workload (BAR CHART)
SELECT u.full_name as faculty, COUNT(ca.id) as courses_taught
FROM users u
LEFT JOIN course_assignments ca ON ca.faculty_id = u.id
WHERE u.role = 'faculty'
GROUP BY u.id, u.full_name
ORDER BY courses_taught DESC;

-- Batch CGPA Averages (BAR CHART)
SELECT b.name as batch, b.status,
       ROUND(AVG(s.cgpa), 2) as avg_cgpa,
       COUNT(s.id) as student_count
FROM batches b
LEFT JOIN students s ON s.batch_id = b.id
GROUP BY b.id, b.name, b.status;

-- Courses per Department (BAR CHART)
SELECT d.name as department, COUNT(c.id) as course_count
FROM departments d
LEFT JOIN courses c ON c.department_id = d.id
GROUP BY d.id, d.name
HAVING course_count > 0
ORDER BY course_count DESC;

-- Users by Role (PIE CHART)
SELECT role, status, COUNT(*) as count
FROM users
GROUP BY role, status
ORDER BY role;

-- Pending Approvals Count
SELECT role, COUNT(*) as pending_count
FROM users
WHERE status = 'pending'
GROUP BY role;

-- =============================================
-- 4. COMPLEX BUSINESS QUERIES
-- =============================================

-- Student Report Card (all grades for a student)
SELECT s.student_id_number, s.first_name, s.last_name,
       c.code as course, c.title as course_title,
       a.title as assessment, a.type, a.max_score,
       g.score, ROUND((g.score / a.max_score * 100), 1) as percentage
FROM grades g
JOIN students s ON g.student_id = s.id
JOIN assessments a ON g.assessment_id = a.id
JOIN course_assignments ca ON a.course_assignment_id = ca.id
JOIN courses c ON ca.course_id = c.id
WHERE s.id = 1
ORDER BY c.code, a.type;

-- Student Attendance Summary per Course
SELECT s.student_id_number,
       CONCAT(s.first_name, ' ', s.last_name) as student_name,
       c.code as course,
       SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) as present,
       SUM(CASE WHEN att.status = 'absent' THEN 1 ELSE 0 END) as absent,
       SUM(CASE WHEN att.status = 'late' THEN 1 ELSE 0 END) as late,
       COUNT(*) as total_classes,
       ROUND(SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as attendance_percentage
FROM attendance att
JOIN students s ON att.student_id = s.id
JOIN course_assignments ca ON att.course_assignment_id = ca.id
JOIN courses c ON ca.course_id = c.id
GROUP BY s.id, s.student_id_number, student_name, c.code
ORDER BY s.student_id_number, c.code;

-- Course Assessment Weight Check (should sum to ~100%)
SELECT c.code as course, c.title,
       SUM(a.weight) as total_weight,
       COUNT(a.id) as assessment_count
FROM assessments a
JOIN course_assignments ca ON a.course_assignment_id = ca.id
JOIN courses c ON ca.course_id = c.id
GROUP BY ca.id, c.code, c.title;
