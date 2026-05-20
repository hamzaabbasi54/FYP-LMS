-- ============================================
-- Migration: 005_add_assessment_questions.sql
-- Add assessment questions and question-level grading
-- ============================================

-- 1. Add conducted_date column to assessments
ALTER TABLE assessments ADD COLUMN conducted_date DATETIME DEFAULT NULL AFTER due_date;

-- 2. Create assessment_questions table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    question_number INT NOT NULL,
    description TEXT DEFAULT NULL,
    max_marks DECIMAL(6,2) NOT NULL DEFAULT 10,
    weightage DECIMAL(5,2) DEFAULT NULL,
    clo_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_assessment_question (assessment_id, question_number),
    INDEX idx_aq_assessment (assessment_id),
    INDEX idx_aq_clo (clo_id),

    CONSTRAINT fk_aq_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aq_clo
        FOREIGN KEY (clo_id) REFERENCES clos(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create question_grades table
CREATE TABLE IF NOT EXISTS question_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    score DECIMAL(6,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_question_grade (assessment_id, student_id, question_id),
    INDEX idx_qg_assessment (assessment_id),
    INDEX idx_qg_student (student_id),
    INDEX idx_qg_question (question_id),

    CONSTRAINT fk_qg_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_qg_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_qg_question
        FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
