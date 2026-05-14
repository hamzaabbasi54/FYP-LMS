-- ============================================
-- File: backend/schema.sql
-- FYP-LMS Database Schema (MySQL)
-- 16 Tables | Full University LMS
-- ============================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS course_assignments;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS syllabi;
DROP TABLE IF EXISTS assessment_clo_mapping;
DROP TABLE IF EXISTS clo_plo_mapping;
DROP TABLE IF EXISTS clos;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS plos;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS faculties;

-- ============================================
-- CORE LAYER
-- ============================================

-- 1. FACULTIES
CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. DEPARTMENTS
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faculty_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_dept_faculty (name, faculty_id),
    INDEX idx_dept_faculty (faculty_id),

    CONSTRAINT fk_dept_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. USERS (superadmin, dean, deptadmin, faculty)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('deptadmin', 'faculty') NOT NULL,
    faculty_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT '',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_faculty (faculty_id),
    INDEX idx_users_department (department_id),
    INDEX idx_users_approved_by (approved_by),

    CONSTRAINT fk_users_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_users_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3.5. NOTIFICATIONS
CREATE TABLE notifications (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ACADEMIC LAYER
-- ============================================

-- 4. BATCHES
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'graduated', 'inactive') DEFAULT 'active',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_batches_department (department_id),
    INDEX idx_batches_status (status),

    CONSTRAINT fk_batches_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. PLOS (Program Learning Outcomes)
CREATE TABLE plos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    plo_number INT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_plo_dept (department_id, plo_number),
    INDEX idx_plos_dept (department_id),

    CONSTRAINT fk_plos_dept
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. SEMESTERS
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    semester_number INT NOT NULL,
    term VARCHAR(20) DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_semester_batch (batch_id, semester_number),
    INDEX idx_semesters_batch (batch_id),

    CONSTRAINT fk_semesters_batch
        FOREIGN KEY (batch_id) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. COURSES
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    credit_hours INT NOT NULL,
    semester_level INT DEFAULT NULL,
    prerequisites VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_courses_department (department_id),
    INDEX idx_courses_semester_level (semester_level),

    CONSTRAINT fk_courses_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7.5 COURSE_PREREQUISITES (Junction Table)
CREATE TABLE course_prerequisites (
    course_id INT NOT NULL,
    prerequisite_course_id INT NOT NULL,
    PRIMARY KEY (course_id, prerequisite_course_id),
    CONSTRAINT fk_prereq_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_prereq_prereq FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. CLOS (Course Learning Outcomes - Standalone)
CREATE TABLE clos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT DEFAULT NULL,
    clo_number INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    cognitive_level ENUM('C1', 'C2', 'C3', 'C4', 'C5', 'C6') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_clo_course (course_id, clo_number),
    INDEX idx_clos_course (course_id),

    CONSTRAINT fk_clos_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8.5. CLO_PLO_MAPPING (Junction Table)
CREATE TABLE clo_plo_mapping (
    clo_id INT NOT NULL,
    plo_id INT NOT NULL,
    PRIMARY KEY (clo_id, plo_id),
    
    CONSTRAINT fk_mapping_clo
        FOREIGN KEY (clo_id) REFERENCES clos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mapping_plo
        FOREIGN KEY (plo_id) REFERENCES plos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8.6 COURSE_CLO_MAPPING (Junction Table - Many-to-Many between courses and CLOs)
CREATE TABLE course_clo_mapping (
    course_id INT NOT NULL,
    clo_id INT NOT NULL,
    PRIMARY KEY (course_id, clo_id),
    CONSTRAINT fk_ccm_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ccm_clo FOREIGN KEY (clo_id) REFERENCES clos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. SYLLABI
CREATE TABLE syllabi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL UNIQUE,
    course_overview TEXT DEFAULT NULL,
    learning_objectives JSON DEFAULT NULL,
    weekly_schedule JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_syllabi_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PEOPLE LAYER
-- ============================================

-- 10. STUDENTS
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) DEFAULT '',
    batch_id INT NOT NULL,
    cgpa DECIMAL(3, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_students_batch (batch_id),
    INDEX idx_students_cgpa (cgpa),

    CONSTRAINT fk_students_batch
        FOREIGN KEY (batch_id) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. PARENTS
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_parents_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- OPERATIONS LAYER
-- ============================================

-- 12. COURSE ASSIGNMENTS (course + semester + faculty)
CREATE TABLE course_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    semester_id INT NOT NULL,
    faculty_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_course_semester (course_id, semester_id),
    INDEX idx_ca_course (course_id),
    INDEX idx_ca_semester (semester_id),
    INDEX idx_ca_faculty (faculty_id),

    CONSTRAINT fk_ca_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ca_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ca_faculty
        FOREIGN KEY (faculty_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. ENROLLMENTS (student + course_assignment)
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_assignment_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_enrollment (student_id, course_assignment_id),
    INDEX idx_enroll_student (student_id),
    INDEX idx_enroll_ca (course_assignment_id),
    INDEX idx_enroll_date (enrolled_at),

    CONSTRAINT fk_enroll_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enroll_ca
        FOREIGN KEY (course_assignment_id) REFERENCES course_assignments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. ASSESSMENTS
CREATE TABLE assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_assignment_id INT NOT NULL,
    type ENUM('quiz', 'assignment', 'midterm', 'final', 'project') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    release_grades_on DATETIME DEFAULT NULL,
    max_score INT NOT NULL DEFAULT 100,
    weight DECIMAL(5, 2) DEFAULT NULL,
    duration_minutes INT DEFAULT NULL,
    status ENUM('draft', 'scheduled', 'published', 'needs_grading', 'graded') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_assess_ca (course_assignment_id),
    INDEX idx_assess_status (status),
    INDEX idx_assess_type (type),
    INDEX idx_assess_due (due_date),

    CONSTRAINT fk_assess_ca
        FOREIGN KEY (course_assignment_id) REFERENCES course_assignments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14.5 ASSESSMENT_CLO_MAPPING (Junction Table)
CREATE TABLE assessment_clo_mapping (
    assessment_id INT NOT NULL,
    clo_id INT NOT NULL,
    PRIMARY KEY (assessment_id, clo_id),
    
    CONSTRAINT fk_mapping_assess
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mapping_assess_clo
        FOREIGN KEY (clo_id) REFERENCES clos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 15. GRADES
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(6, 2) DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    graded_by INT DEFAULT NULL,
    graded_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_grade (assessment_id, student_id),
    INDEX idx_grades_assessment (assessment_id),
    INDEX idx_grades_student (student_id),
    INDEX idx_grades_graded_by (graded_by),
    INDEX idx_grades_score (score),

    CONSTRAINT fk_grades_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_grades_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_grades_graded_by
        FOREIGN KEY (graded_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. ATTENDANCE
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
    remarks VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_attendance (course_assignment_id, student_id, date),
    INDEX idx_attend_ca (course_assignment_id),
    INDEX idx_attend_student (student_id),
    INDEX idx_attend_date (date),
    INDEX idx_attend_status (status),

    CONSTRAINT fk_attend_ca
        FOREIGN KEY (course_assignment_id) REFERENCES course_assignments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attend_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SAMPLE SEED DATA
-- ============================================

-- Faculties
INSERT INTO faculties (name) VALUES
('Natural Sciences'),
('Social Sciences'),
('Medicine'),
('Biological Sciences');

-- Departments
INSERT INTO departments (name, faculty_id) VALUES
('Physics', 1),
('Chemistry', 1),
('Mathematics', 1),
('Environmental Science', 1),
('Psychology', 2),
('Sociology', 2),
('Economics', 2),
('Political Science', 2),
('General Medicine', 3),
('Surgery', 3),
('Pharmacy', 3),
('Nursing', 3),
('Biotechnology', 4),
('Microbiology', 4),
('Genetics', 4),
('Zoology', 4);

-- Department Admin (primary admin of the system)
-- Password: admin123 — replace hash with actual bcrypt hash in production
INSERT INTO users (full_name, email, password, role, department_id, status, is_active) VALUES
('Prof. Sarah Khan', 'admin@gmail.com', '$2b$10$YourHashedPasswordHere', 'deptadmin', 1, 'approved', TRUE);

-- Sample Faculty Member
INSERT INTO users (full_name, email, password, role, department_id, phone_number, status, approved_by, is_active) VALUES
('Dr. Emily Carter', 'emily.carter@university.edu', '$2b$10$YourHashedPasswordHere', 'faculty', 1, '+1 555-0101', 'approved', 1, TRUE);

-- Sample Batch
INSERT INTO batches (name, department_id, start_date, end_date, status, is_active) VALUES
('Physics - Class of 2027', 1, '2023-08-01', '2027-06-30', 'active', TRUE);

-- Sample PLOs for the department
INSERT INTO plos (department_id, plo_number, description) VALUES
(1, 1, 'Analyze complex physics problems and apply principles of physics.'),
(1, 2, 'Design, implement, and evaluate physics-based solutions.'),
(1, 3, 'Communicate effectively in a variety of professional contexts.'),
(1, 4, 'Recognize professional responsibilities and ethical principles.'),
(1, 5, 'Function effectively as a member or leader of a team.');

-- Sample Semesters
INSERT INTO semesters (batch_id, name, semester_number, term, start_date, end_date) VALUES
(1, 'Semester 1', 1, 'Fall 2023', '2023-08-15', '2023-12-15'),
(1, 'Semester 2', 2, 'Spring 2024', '2024-01-15', '2024-05-15'),
(1, 'Semester 3', 3, 'Fall 2024', '2024-08-15', '2024-12-15');

-- Sample Courses
INSERT INTO courses (title, code, department_id, credit_hours, semester_level, prerequisites, description) VALUES
('Introduction to Quantum Physics', 'PHY-301', 1, 3, 1, 'None', 'Fundamental concepts of quantum mechanics.'),
('Classical Mechanics', 'PHY-101', 1, 3, 1, 'None', 'Newtonian mechanics and its applications.'),
('Electromagnetism', 'PHY-201', 1, 3, 2, 'PHY-101', 'Electric and magnetic fields, Maxwells equations.');

-- Sample CLOs
INSERT INTO clos (course_id, clo_number, title, description, cognitive_level) VALUES
(1, 1, 'Wave-Particle Duality', 'Understand wave-particle duality of matter.', 'C2'),
(1, 2, 'Schrodinger Equation', 'Apply Schrodinger equation to simple systems.', 'C3'),
(2, 1, 'Newton Laws', 'Analyze motion using Newtons laws.', 'C3');

-- Sample CLO-PLO Mappings
INSERT INTO clo_plo_mapping (clo_id, plo_id) VALUES
(1, 1),
(2, 1),
(3, 1);

-- Sample Syllabus
INSERT INTO syllabi (course_id, course_overview, learning_objectives, weekly_schedule) VALUES
(1, 'This course covers quantum mechanics fundamentals.',
 '["Understand quantum mechanics basics", "Solve simple quantum problems", "Analyze wave functions"]',
 '["Week 1: Introduction & History", "Week 2: Wave-Particle Duality", "Week 3: Schrodinger Equation"]');

-- Sample Students
INSERT INTO students (student_id_number, first_name, last_name, email, phone, batch_id, cgpa) VALUES
('U2024001', 'Alice', 'Johnson', 'alice.j@university.edu', '+1 123-456-7890', 1, 3.85),
('U2024002', 'Bob', 'Williams', 'bob.w@university.edu', '+1 234-567-0981', 1, 3.50),
('U2024003', 'Charlie', 'Brown', 'charlie.b@university.edu', '+1 865-674-0012', 1, 3.02),
('U2024004', 'Diana', 'Miller', 'diana.m@university.edu', '+1 456-789-0123', 1, 3.71),
('U2024005', 'Ethan', 'Davis', 'ethan.d@university.edu', '+1 567-890-1234', 1, 2.64),
('U2024006', 'Fiona', 'Garcia', 'fiona.g@university.edu', '+1 678-901-2345', 1, 3.98);

-- Sample Parents
INSERT INTO parents (student_id, name, email, phone) VALUES
(1, 'Robert Johnson', 'robert.j@email.com', '+1 234-567-8901'),
(2, 'Mary Williams', 'mary.w@email.com', '+1 345-678-9012'),
(3, 'David Brown', 'david.b@email.com', '+1 456-789-0123'),
(4, 'Sarah Miller', 'sarah.m@email.com', '+1 567-890-1234'),
(5, 'Michael Davis', 'michael.d@email.com', '+1 678-901-2345'),
(6, 'Jennifer Garcia', 'jennifer.g@email.com', '+1 789-012-3456');

-- Sample Course Assignments (course + semester + faculty)
INSERT INTO course_assignments (course_id, semester_id, faculty_id) VALUES
(1, 1, 4),   -- PHY-301 in Semester 1, taught by Dr. Emily Carter
(2, 1, 4),   -- PHY-101 in Semester 1, taught by Dr. Emily Carter
(3, 2, 4);   -- PHY-201 in Semester 2, taught by Dr. Emily Carter

-- Sample Enrollments
INSERT INTO enrollments (student_id, course_assignment_id) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1),  -- All students in PHY-301
(1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2);   -- All students in PHY-101

-- Sample Assessments
INSERT INTO assessments (course_assignment_id, type, title, description, due_date, max_score, weight, duration_minutes, status) VALUES
(1, 'midterm', 'Midterm Exam', 'Covers chapters 1-5.', '2023-10-28 09:00:00', 100, 30.00, 120, 'graded'),
(1, 'assignment', 'OOP Concepts Essay', 'Write about quantum principles.', '2023-10-24 23:59:00', 50, 10.00, NULL, 'needs_grading'),
(1, 'quiz', 'Control Structures Quiz', 'Quick quiz on wave mechanics.', '2023-10-10 10:00:00', 20, 5.00, 30, 'published'),
(1, 'final', 'Final Project', 'Comprehensive final project.', '2023-12-15 09:00:00', 100, 40.00, NULL, 'draft');

-- Sample Assessment-CLO Mappings
INSERT INTO assessment_clo_mapping (assessment_id, clo_id) VALUES
(1, 1), (1, 2), -- Midterm tests CLO 1 and 2
(2, 2),         -- Essay tests CLO 2
(3, 1),         -- Quiz tests CLO 1
(4, 1), (4, 2); -- Final tests CLO 1 and 2


-- Sample Grades
INSERT INTO grades (assessment_id, student_id, score, remarks, graded_by, graded_at) VALUES
(1, 1, 92.50, 'Excellent work', 4, '2023-10-30 14:00:00'),
(1, 2, 78.00, 'Good effort', 4, '2023-10-30 14:30:00'),
(1, 3, 65.00, 'Needs improvement', 4, '2023-10-30 15:00:00'),
(1, 4, 88.50, 'Very good', 4, '2023-10-30 15:30:00'),
(1, 5, 55.00, 'Below average', 4, '2023-10-30 16:00:00'),
(1, 6, 97.00, 'Outstanding', 4, '2023-10-30 16:30:00');

-- Sample Attendance
INSERT INTO attendance (course_assignment_id, student_id, date, status, remarks) VALUES
(1, 1, '2023-10-25', 'present', ''),
(1, 2, '2023-10-25', 'absent', 'Sick Leave'),
(1, 3, '2023-10-25', 'present', '15 min late'),
(1, 4, '2023-10-25', 'present', ''),
(1, 5, '2023-10-25', 'present', ''),
(1, 6, '2023-10-25', 'absent', '');
