-- Migration: Add batch_semester_courses table for batch-specific curriculum overrides
-- When a curriculum is assigned to a batch, its courses are copied here.
-- Edits on the batch page modify this table, NOT the original curriculum.

CREATE TABLE IF NOT EXISTS batch_semester_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    semester_number INT NOT NULL,
    course_id INT NOT NULL,
    type ENUM('core', 'elective') DEFAULT 'core',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_bsc_entry (batch_id, semester_number, course_id),
    UNIQUE KEY uq_bsc_batch_course (batch_id, course_id),
    INDEX idx_bsc_batch (batch_id),
    INDEX idx_bsc_course (course_id),

    CONSTRAINT fk_bsc_batch
        FOREIGN KEY (batch_id) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bsc_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
