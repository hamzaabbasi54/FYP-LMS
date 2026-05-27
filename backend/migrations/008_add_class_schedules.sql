-- Migration: Add class_schedules table for weekly class schedule
-- Admin sets the schedule per course per batch; faculty can view it.

CREATE TABLE IF NOT EXISTS class_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    course_id INT NOT NULL,
    faculty_id INT DEFAULT NULL,
    day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift ENUM('morning','evening') NOT NULL DEFAULT 'morning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_schedule_entry (batch_id, course_id, day_of_week),
    INDEX idx_cs_batch (batch_id),
    INDEX idx_cs_course (course_id),
    INDEX idx_cs_faculty (faculty_id),

    CONSTRAINT fk_cs_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cs_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cs_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
