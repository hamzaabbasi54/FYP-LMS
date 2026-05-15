-- Add new academic fields to students table
ALTER TABLE students 
ADD COLUMN matric_marks DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN fsc_marks DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN background ENUM('pre-med', 'pre-engineering', 'ics', 'other') DEFAULT NULL;
