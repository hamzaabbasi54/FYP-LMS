-- Migration: Add course_assignment_files table for uploaded course content (syllabus, etc.)
-- This table was missing from prior migrations but referenced in batchRoutes.js

CREATE TABLE IF NOT EXISTS course_assignment_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_assignment_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) DEFAULT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_caf_assignment (course_assignment_id),

    CONSTRAINT fk_caf_assignment
        FOREIGN KEY (course_assignment_id) REFERENCES course_assignments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
