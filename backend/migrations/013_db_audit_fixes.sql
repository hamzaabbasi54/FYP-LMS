-- ============================================
-- Migration: 013_db_audit_fixes.sql
-- Implements safe DB corrections from audit
-- ============================================

-- CHANGE 4: Add FK to batch_semester_courses.semester_number
-- First check for orphans (rows with invalid semester_number for their batch)
-- If orphans exist, this FK will fail — they must be cleaned up first.

-- CHANGE 2: Drop redundant enrollments.enrolled_at column
ALTER TABLE enrollments DROP INDEX idx_enroll_date;
ALTER TABLE enrollments DROP COLUMN enrolled_at;

-- CHANGE 3 Phase 1: Add soft-delete columns (non-breaking, no feature change)
ALTER TABLE courses ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE assessments ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE semesters ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- CHANGE 1: Drop redundant courses.prerequisites VARCHAR column
-- (junction table course_prerequisites is the correct source of truth)
ALTER TABLE courses DROP COLUMN prerequisites;
