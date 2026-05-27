-- Update matric_marks and fsc_marks to allow values >= 1000
ALTER TABLE students 
MODIFY COLUMN matric_marks DECIMAL(6,2) DEFAULT NULL,
MODIFY COLUMN fsc_marks DECIMAL(6,2) DEFAULT NULL;
