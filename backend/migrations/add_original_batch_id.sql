-- Add original_batch_id to enrollments table
-- Tracks which batch a student originally belongs to when enrolled cross-batch
ALTER TABLE enrollments ADD COLUMN original_batch_id INT NULL AFTER course_assignment_id;
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollment_original_batch FOREIGN KEY (original_batch_id) REFERENCES batches(id) ON DELETE SET NULL;
