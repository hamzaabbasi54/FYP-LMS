-- Migration: Add invite token columns to users table for invite flow
ALTER TABLE users
  ADD COLUMN invite_token VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN invite_expires DATETIME NULL DEFAULT NULL;
