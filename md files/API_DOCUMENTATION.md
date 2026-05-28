# FYP-LMS: API Documentation & Routing Overview

The backend uses Express.js. All API routes are prefixed with `/api` in `server.js` and mounted to specific router files located in `backend/routes/`.

## Route Mount Points (`server.js`)
- `/api/auth` -> `auth.js`: General login, password resets.
- `/api/admin` -> `adminRoutes.js`: Admin-specific actions, overview statistics.
- `/api/faculty` -> `facultyRoutes.js`: Faculty user management and lists.
- `/api/student` -> `studentRoutes.js`: Student user management, bulk imports.
- `/api/parent` -> `parentRoutes.js`: Parent user management.
- `/api/departments` -> `departmentRoutes.js`: CRUD for faculties and departments.
- `/api/batches` -> `batchRoutes.js`: CRUD for batches, and nested resources (semesters, batch_semester_courses, class_schedules).
- `/api/curricula` -> `curriculumRoutes.js`: Master degree blueprints.
- `/api/courses` -> `courseRoutes.js`: Global course catalog, course assignments, faculty schedule (`/my-schedule`), syllabi.
- `/api/assessments` -> `assessmentRoutes.js`: Creation and management of quizzes, assignments, exams, and questions.
- `/api/attendance` -> `attendanceRoutes.js`: Recording and fetching attendance.
- `/api/dashboard` -> `dashboardRoutes.js`: Analytics and metrics for the frontend dashboards.
- `/api/approvals` -> `approvalRoutes.js`: Workflow for approving pending user registrations.
- `/api/notifications` -> `notificationRoutes.js`: Fetching and marking notifications as read.

## Middleware & Security
- `verifyToken`: Validates the JWT provided in the `Authorization: Bearer <token>` header. Attached to almost all routes.
- `isAdmin`: Ensures `req.user.role === 'deptadmin'`.
- `isFaculty`: Ensures `req.user.role === 'faculty'`.
- `isAuthenticated`: Ensures the user is either admin or faculty.

## API Response Format
Most endpoints return a standardized JSON structure:
```json
{
  "success": true, // or false
  "message": "Human readable status message",
  "data": { ... } // Array or Object containing the requested payload
}
```

Paginated endpoints use the `parsePagination` and `paginatedResponse` utilities, returning:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Frontend Integration (`api.js`)
On the frontend, `frontend/src/services/api.js` creates a centralized Axios instance. It automatically attaches the JWT token from `localStorage` to every request using an interceptor.

API methods are grouped into exported objects mirroring the backend structure:
- `authApi`
- `batchApi`
- `courseApi`
- `studentApi`
- etc.
