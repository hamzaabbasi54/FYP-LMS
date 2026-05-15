-- Migration: Add password reset token columns to users table
ALTER TABLE users
  ADD COLUMN reset_token VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN reset_expires DATETIME NULL DEFAULT NULL;
