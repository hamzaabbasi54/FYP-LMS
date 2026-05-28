# FYP-LMS: System Architecture

## Overview
FYP-LMS is a full-stack University Learning Management System (LMS) built for faculties, department admins, and students (and parents). It handles course management, batch management, enrollment, assessments, grading, and attendance.

## Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: React Icons (Material Design)
- **State/API**: Axios for API calls, React Toastify for notifications

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: JSON Web Tokens (JWT)
- **File Uploads**: Multer (for CSV/Excel imports)
- **Database Driver**: `mysql2` (using connection pools and async/await)

## Architecture Pattern
The system follows a classic client-server architecture:
1. **Frontend (SPA)**: A single-page application built with React. It communicates with the backend exclusively via RESTful APIs.
2. **Backend (REST API)**: An Express.js server that handles business logic, database queries, and authentication.
3. **Database Layer**: A relational MySQL database using raw SQL queries (no ORM). Migration scripts manage schema changes.

## Key System Components

### 1. Authentication & Authorization
- Users are assigned roles: `deptadmin`, `faculty`, `student`, `parent`.
- Passwords are hashed using bcrypt.
- Protected routes use JWT middleware (`verifyToken`, `isAdmin`, `isFaculty`, etc.) to ensure proper authorization.

### 2. Core Academic Hierarchy
- **Faculties** > **Departments** > **Batches** > **Semesters** > **Course Assignments**.
- A curriculum defines the blueprint of courses for semesters. Batches can adopt curricula or have bespoke overrides (`batch_semester_courses`).

### 3. OBE (Outcome-Based Education) Integration
- Courses are linked to **CLOs** (Course Learning Outcomes).
- Departments define **PLOs** (Program Learning Outcomes).
- CLOs are mapped to PLOs.
- Assessments (quizzes, assignments, exams) are mapped to specific CLOs, allowing the system to track student performance against learning outcomes.

### 4. Database Interaction
- Uses `mysql2/promise` with a connection pool (`backend/config/db.js`).
- Manual transactions (`conn.beginTransaction()`) are used extensively for complex inserts (e.g., creating a course with its prerequisites and CLO mappings).
- A custom migration runner (`backend/migrate.js`) executes `.sql` files in sequence.

### 5. File Processing
- System supports bulk importing of courses, students, and CLOs using Excel/CSV files via `xlsx` and `multer`.
