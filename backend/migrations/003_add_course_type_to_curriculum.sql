-- ============================================
-- Migration: 003_add_course_type_to_curriculum.sql
-- Adds course type (core/elective) to curriculum semester courses
-- ============================================

ALTER TABLE curriculum_semester_courses 
ADD COLUMN type ENUM('core', 'elective') NOT NULL DEFAULT 'core' AFTER course_id;
