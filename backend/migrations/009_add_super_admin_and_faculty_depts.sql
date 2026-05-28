-- ============================================
-- File: backend/migrations/009_add_super_admin_and_faculty_depts.sql
-- Description: Adds super_admin role, user_departments table, and seeds actual university departments.
-- ============================================

-- 1. Update the users role ENUM
ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'deptadmin', 'faculty') NOT NULL;

-- 2. Create user_departments table (For multi-department faculty support)
CREATE TABLE IF NOT EXISTS user_departments (
    user_id INT NOT NULL,
    department_id INT NOT NULL,
    employment_type ENUM('permanent', 'visiting') DEFAULT 'permanent',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, department_id),
    CONSTRAINT fk_ud_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ud_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Seed Faculties
INSERT IGNORE INTO faculties (id, name) VALUES 
(1, 'Faculty of Natural Sciences'),
(2, 'Faculty of Biological Sciences'),
(3, 'Faculty of Social Sciences');

-- 4. Seed Departments
INSERT IGNORE INTO departments (name, faculty_id) VALUES 
-- Natural Sciences
('Department of Chemistry', 1),
('Department of Computer Sciences', 1),
('Department of Earth Sciences', 1),
('Department of Electronics', 1),
('Department of Mathematics', 1),
('Department of Physics', 1),
('Department of Statistics', 1),
('Institute of Information Technology', 1),

-- Biological Sciences
('Department of Animal Sciences (Zoology)', 2),
('Department of Biochemistry', 2),
('Department of Biotechnology', 2),
('Department of Environmental Sciences', 2),
('Department of Microbiology', 2),
('Department of Pharmacy', 2),
('Department of Plant Sciences', 2),
('National Centre for Bioinformatics', 2),

-- Social Sciences
('Department of Anthropology', 3),
('Department of Defence & Strategic Studies (DSS)', 3),
('Department of English / Linguistics', 3),
('Department of History', 3),
('School of Economics', 3),
('School of Law', 3),
('School of Politics and International Relations (SPIR)', 3),
('School of Sociology', 3),
('Quaid-i-Azam School of Management Sciences (QASMS)', 3),
('Taxila Institute of Asian Civilizations', 3),
('National Institute of Pakistan Studies (NIPS)', 3),
('National Institute of Psychology (NIP)', 3),
('Centre of Excellence in Gender Studies', 3),
('Area Study Centre for Africa, North & South America', 3);

-- Note: We assume the existing super admin account will be manually created or updated,
-- e.g., UPDATE users SET role = 'super_admin' WHERE email = 'admin@example.com';
