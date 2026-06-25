-- Add session invalidation support used by auth middleware/controllers.
ALTER TABLE users
    ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER is_active;

