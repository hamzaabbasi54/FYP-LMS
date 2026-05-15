-- ============================================
-- Migration: 002_add_curriculum_tables.sql
-- Adds Curriculum Management System
-- ============================================

-- 1. CURRICULA (Blueprint for a program's course structure)
CREATE TABLE IF NOT EXISTS curricula (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    department_id INT NOT NULL,
    description TEXT DEFAULT NULL,
    total_semesters INT NOT NULL DEFAULT 8,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_curricula_dept (department_id),

    CONSTRAINT fk_curricula_dept
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CURRICULUM_SEMESTERS (Each curriculum has 8 semesters)
CREATE TABLE IF NOT EXISTS curriculum_semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curriculum_id INT NOT NULL,
    semester_number INT NOT NULL,
    name VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_curriculum_sem (curriculum_id, semester_number),
    INDEX idx_csem_curriculum (curriculum_id),

    CONSTRAINT fk_csem_curriculum
        FOREIGN KEY (curriculum_id) REFERENCES curricula(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. CURRICULUM_SEMESTER_COURSES (Courses in each semester of a curriculum)
CREATE TABLE IF NOT EXISTS curriculum_semester_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curriculum_semester_id INT NOT NULL,
    course_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_csc_entry (curriculum_semester_id, course_id),
    INDEX idx_csc_semester (curriculum_semester_id),
    INDEX idx_csc_course (course_id),

    CONSTRAINT fk_csc_semester
        FOREIGN KEY (curriculum_semester_id) REFERENCES curriculum_semesters(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_csc_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add curriculum_id to batches (nullable to keep existing batches working)
ALTER TABLE batches ADD COLUMN curriculum_id INT DEFAULT NULL AFTER department_id;
ALTER TABLE batches ADD INDEX idx_batches_curriculum (curriculum_id);
ALTER TABLE batches ADD CONSTRAINT fk_batches_curriculum
    FOREIGN KEY (curriculum_id) REFERENCES curricula(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
