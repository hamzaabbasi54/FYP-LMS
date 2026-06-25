-- Performance indexes for production-scale data access.
-- These indexes support login/token lookup, department dashboards, attendance,
-- grading, messages, and common search/filter screens.

ALTER TABLE users ADD INDEX idx_users_email_role_status (email, role, status, is_active);
ALTER TABLE users ADD INDEX idx_users_invite_token_expires (invite_token, invite_expires);
ALTER TABLE users ADD INDEX idx_users_reset_token_expires (reset_token, reset_expires);
ALTER TABLE users ADD INDEX idx_users_dept_role_status (department_id, role, status, is_active);
ALTER TABLE users ADD INDEX idx_users_name_email (full_name, email);

ALTER TABLE students ADD INDEX idx_students_batch_active_name (batch_id, is_active, last_name, first_name);
ALTER TABLE students ADD INDEX idx_students_name_lookup (last_name, first_name, student_id_number);

ALTER TABLE batches ADD INDEX idx_batches_dept_status_start (department_id, status, start_date);
ALTER TABLE courses ADD INDEX idx_courses_dept_code_title (department_id, code, title);

ALTER TABLE course_assignments ADD INDEX idx_ca_faculty_course_semester (faculty_id, course_id, semester_id);
ALTER TABLE course_assignments ADD INDEX idx_ca_semester_faculty (semester_id, faculty_id);

ALTER TABLE enrollments ADD INDEX idx_enroll_ca_student (course_assignment_id, student_id);
ALTER TABLE enrollments ADD INDEX idx_enroll_ca_created (course_assignment_id, enrolled_at);

ALTER TABLE attendance ADD INDEX idx_attend_ca_date_status (course_assignment_id, date, status);
ALTER TABLE attendance ADD INDEX idx_attend_ca_student_date (course_assignment_id, student_id, date);

ALTER TABLE assessments ADD INDEX idx_assess_ca_type_status_due (course_assignment_id, type, status, due_date);

ALTER TABLE grades ADD INDEX idx_grades_assessment_score (assessment_id, score);
ALTER TABLE question_grades ADD INDEX idx_qg_assessment_student (assessment_id, student_id);

ALTER TABLE messages ADD INDEX idx_msg_recipient_read_created (recipient_id, is_read, created_at);
ALTER TABLE messages ADD INDEX idx_msg_dept_users_created (department_id, sender_id, recipient_id, created_at);

ALTER TABLE notifications ADD INDEX idx_notifications_user_read_created (user_id, is_read, created_at);
