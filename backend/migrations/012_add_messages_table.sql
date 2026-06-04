-- Migration: Add messages table for department-scoped chat
-- Messages are 1-to-1, persisted in MySQL, and delivered in real-time via Socket.IO

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    department_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_msg_sender (sender_id),
    INDEX idx_msg_recipient (recipient_id),
    INDEX idx_msg_department (department_id),
    INDEX idx_msg_read (is_read),
    INDEX idx_msg_created (created_at),
    -- Composite index for conversation queries
    INDEX idx_msg_conversation (sender_id, recipient_id, created_at),

    CONSTRAINT fk_msg_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_msg_recipient
        FOREIGN KEY (recipient_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_msg_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
