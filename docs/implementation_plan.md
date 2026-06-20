# Student Portal API — Implementation Plan

## Problem Statement

The mobile app team needs a backend API so students can log in and view their enrolled courses and attendance. Currently, students exist only in the `students` table (a data record) and have **no login credentials**. We need to:

1. **Auto-create student accounts** when admin imports/adds students to a batch
2. **Expose student-facing API endpoints** for the mobile app (login, courses, attendance)
3. **Handle 5,000+ concurrent students** efficiently

---

## Current Architecture Snapshot

| Concern | Current State |
|---------|--------------|
| **Students table** | Has `student_id_number` (roll no.), `email`, `first_name`, `last_name`, `batch_id`. No password. |
| **Users table** | Has `email`, `password`, `role` (super_admin / deptadmin / faculty), `token_version`, login support. |
| **Auth system** | JWT in HTTP-only cookies, Redis-cached `token_version` check, role-based middleware. |
| **Student import** | Admin uploads Excel → rows inserted into `students` table. No account created. |
| **Enrollments** | `enrollments` table links `student_id` → `course_assignment_id`. Already tracks which courses a student takes. |
| **Attendance** | `attendance` table links `course_assignment_id` + `student_id` + `date` + `status`. Already tracks per-class attendance. |

> [!IMPORTANT]
> The `token_version` column is used in the auth middleware but **has no migration**. This was the original CodeRabbit finding. We must add it as part of this work.

---

## Design Decision: Separate `student_accounts` Table vs. Adding Students to `users`

### Recommended: New `student_accounts` table ✅

| Pro | Reason |
|-----|--------|
| **Zero risk to existing system** | The `users` table powers admin/faculty auth, role middleware, department scoping, and Socket.IO. Injecting 5,000 student rows would break existing queries (user counts, role filters, etc.) |
| **Different auth contract** | Students have a `student_id` FK, use roll-number-based passwords, and are read-only consumers. Faculty have permissions, can create content, etc. |
| **Scalable** | A lean table with just auth fields + FK to `students` is fast to query at scale |
| **Mobile-first** | The mobile app can use a dedicated `/api/student-auth/*` route prefix, completely isolated from the admin panel |

### Schema

```sql
CREATE TABLE student_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,          -- FK → students.id
    email VARCHAR(100) NOT NULL UNIQUE,       -- copied from students.email
    password VARCHAR(255) NOT NULL,           -- bcrypt(last 5 digits of roll number)
    token_version INT NOT NULL DEFAULT 0,     -- for session invalidation
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_sa_student (student_id),
    INDEX idx_sa_email (email),

    CONSTRAINT fk_sa_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Proposed Changes

### Phase 1: Database Migration

#### [NEW] `backend/migrations/015_add_student_accounts.sql`

- Creates the `student_accounts` table (schema above)
- Also adds `token_version INT NOT NULL DEFAULT 0` to the `users` table (the missing column that CodeRabbit flagged)

---

### Phase 2: Auto-Account Creation on Student Import

#### [MODIFY] [studentRoutes.js](file:///d:/FYP/FYP-LMS/backend/routes/studentRoutes.js)

When a student is created (either single POST or Excel bulk import), we will **automatically**:

1. Extract the last 5 characters of the `student_id_number` (roll number)
2. Hash it with bcrypt
3. Insert a row into `student_accounts` with the hashed password

**Password logic:**
```
Roll Number: "QAU-2024-12345"  →  Password: "12345"
Roll Number: "BS-IT-001"       →  Password: "T-001"  (last 5 chars)
```

**Changes in the existing import flow:**
- After each student INSERT (line ~317-330), add an INSERT into `student_accounts`
- Use `ON DUPLICATE KEY UPDATE` so re-imports don't crash
- Same for the single-student POST handler (line ~153-157)

> [!IMPORTANT]
> This runs inside the existing transaction, so if the student insert fails, no orphan account is created.

---

### Phase 3: Student Auth System

#### [NEW] `backend/routes/studentAuthRoutes.js`

A dedicated route file for student authentication, mounted at `/api/student-auth`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | Email + password login, returns JWT cookie |
| `/me` | GET | Returns student profile (protected) |
| `/logout` | POST | Clears cookie |
| `/change-password` | PUT | Allows student to change their default password |

**JWT payload for students:**
```json
{
  "id": 42,               // student_accounts.id
  "student_id": 15,       // students.id (FK)
  "email": "alice@uni.edu",
  "role": "student",
  "token_version": 0
}
```

#### [NEW] `backend/middleware/studentAuth.js`

A lightweight middleware that:
1. Reads the JWT from cookie (same cookie name `token` or a separate `student_token`)
2. Verifies `role === 'student'`
3. Checks `token_version` against `student_accounts` (Redis-cached, same pattern as admin auth)
4. Attaches `req.student` with `{ id, student_id, email }`

> [!TIP]
> We reuse the **exact same Redis caching pattern** (`session:student:<id>`) from the admin auth middleware. No new infrastructure needed.

---

### Phase 4: Student-Facing API Endpoints

#### [NEW] `backend/routes/studentPortalRoutes.js`

Mounted at `/api/student-portal`, protected by `studentAuth` middleware:

| Endpoint | Method | Description | Performance |
|----------|--------|-------------|-------------|
| `/profile` | GET | Student's own profile (name, roll no., batch, department) | Simple indexed lookup |
| `/courses` | GET | All courses the student is enrolled in (current semester) | Joins: `enrollments → course_assignments → courses → semesters` |
| `/schedule` | GET | Weekly class schedule with timings, days, and assigned faculty | Joins: `class_schedules → courses → users` (faculty) |
| `/courses/:courseAssignmentId/attendance` | GET | Attendance records for a specific course | Indexed on `(course_assignment_id, student_id)` |
| `/attendance/summary` | GET | Attendance summary across all courses (present/absent/late counts) | Single aggregated query |
| `/courses/:courseAssignmentId/grades` | GET | Grades for assessments in a specific course | Indexed on `(assessment_id, student_id)` |

**Sample response for `/courses`:**
```json
{
  "success": true,
  "data": [
    {
      "course_assignment_id": 1,
      "course_title": "Introduction to Quantum Physics",
      "course_code": "PHY-301",
      "credit_hours": 3,
      "semester": "Semester 1",
      "instructor": "Dr. Emily Carter",
      "attendance_summary": {
        "total_classes": 15,
        "present": 12,
        "absent": 2,
        "late": 1,
        "percentage": 80.0
      }
    }
  ]
}
```

---

### Phase 5: Performance for 5,000 Students

| Strategy | Implementation |
|----------|---------------|
| **Redis session cache** | Cache `student_accounts.token_version + is_active` with TTL 1 hour (identical to admin pattern). Eliminates MySQL hit on every request. |
| **Indexed queries** | All queries use existing composite indexes (`enrollments(student_id, course_assignment_id)`, `attendance(course_assignment_id, student_id, date)`). No table scans. |
| **Lean JWT** | Student JWT contains only IDs + role. No heavy data in the token. |
| **No connection pooling changes** | Current MySQL pool handles 5K concurrent reads easily since all student endpoints are **read-only** (SELECT only). |
| **Rate limiting** | Add `express-rate-limit` on student auth routes (e.g., 5 login attempts per minute per IP) to prevent brute-force. |

---

### Phase 6: Wire Up in Server

#### [MODIFY] [server.js](file:///d:/FYP/FYP-LMS/backend/server.js)

```js
import studentAuthRoutes from './routes/studentAuthRoutes.js';
import studentPortalRoutes from './routes/studentPortalRoutes.js';

app.use('/api/student-auth', studentAuthRoutes);
app.use('/api/student-portal', studentPortalRoutes);
```

---

## File Summary

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `migrations/015_add_student_accounts.sql` | Create `student_accounts` table + add `token_version` to `users` |
| **MODIFY** | `routes/studentRoutes.js` | Auto-create `student_accounts` row when student is added/imported |
| **NEW** | `middleware/studentAuth.js` | JWT verification middleware for student role |
| **NEW** | `routes/studentAuthRoutes.js` | Login, logout, me, change-password for students |
| **NEW** | `routes/studentPortalRoutes.js` | Courses, attendance endpoints for mobile app |
| **MODIFY** | `server.js` | Mount the two new route files |

---

## Design Decisions (Resolved)

**1. Authentication Mechanism (Bearer Tokens vs Cookies)**
*   **Decision:** The system will return a JWT upon login. The mobile app **must** send this JWT as a Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).
*   **Reasoning:** This is the industry standard for mobile applications. Mobile HTTP clients do not automatically manage cookies like web browsers do. While the backend middleware will still support cookies as a fallback, Bearer tokens are the primary method for the app.

**2. Session Isolation (Cookie Naming)**
*   **Decision:** The student authentication system will use a distinct cookie name (`student_token`) instead of the default `token` used by the admin/faculty portal.
*   **Reasoning:** If a user logs into both the admin portal and the student portal on the same browser (e.g., during testing or web portal expansion), using the same cookie name would overwrite and invalidate the sessions.

**3. Inclusion of Grades Data**
*   **Decision:** The read-only endpoints will include a `/grades` route to fetch assessment scores.
*   **Reasoning:** Exposing grades is a core feature of any LMS mobile app. Since the `grades` table is already populated and indexed, exposing this data via a read-only endpoint adds immense value with minimal backend effort.

---

## Verification Plan

### Automated Tests
- Import 100 students via Excel → verify 100 `student_accounts` rows created
- Login with last-5-digits password → verify JWT returned
- Hit `/courses` and `/attendance` → verify correct data scoped to student
- Change password → verify old password stops working

### Manual Verification
- Mobile team hits the endpoints with Postman/Insomnia
- Load test with 100 concurrent student logins using `autocannon` or `k6`
