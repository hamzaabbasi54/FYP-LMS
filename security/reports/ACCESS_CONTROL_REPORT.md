# ACCESS_CONTROL Security Report

## Status: HIGH

## Findings

### 1. `assessmentRoutes.js` missing ownership checks
- **`POST /` (Create assessment):** Takes `course_assignment_id` in body. No check if the requesting faculty actually teaches that course assignment.
- **`PUT /:id` (Update assessment):** Takes `id` in URL. Updates the assessment directly. No check if the requesting faculty owns the assessment.
- **`DELETE /:id` (Delete assessment):** Takes `id` in URL. Deletes directly. No check if the requesting faculty owns the assessment.
- *Note:* `POST /:id/grades` does have an ownership check (`authCheck[0].faculty_id !== req.user.id`).

### 2. `attendanceRoutes.js` missing ownership checks
- **`POST /course/:courseAssignmentId` (Save attendance):** Takes `courseAssignmentId` in URL. Upserts attendance records directly. No check if the requesting faculty teaches the course assignment.
- **`POST /import/:courseAssignmentId` (Import attendance):** Same as above, no ownership check.
- **`PUT /:id` (Update single record):** Missing ownership check.

### 3. Department scoping
- The `scopeToDepartment` middleware (`backend/middleware/deptScope.js`) correctly scopes `deptadmin` users to their own department's resources.
- However, this middleware specifically skips non-deptadmin users (`if (req.user.role !== 'deptadmin') return next();`). This means it does not protect resources from unauthorized `faculty` modifications.

## What's at risk

An authenticated faculty member can modify or delete assessments belonging to other faculty members. They can also create fake assessments or modify attendance records for courses they do not teach, simply by knowing or guessing the `course_assignment_id` or assessment `id`.

## What's already secure

- Saving grades (`POST /api/assessments/:id/grades`) correctly verifies that `req.user.id` matches the `faculty_id` of the `course_assignment`.
- Admin-only routes (`isAdmin`) correctly restrict access for operations like course creation, batch creation, etc.

## Recommendations

1. **HIGH:** Create a `scopeFacultyCourse` middleware or inline checks to ensure that a faculty member can only modify assessments/attendance for `course_assignments` they are assigned to.
2. **HIGH:** Apply this check to `POST /`, `PUT /:id`, and `DELETE /:id` in `assessmentRoutes.js`.
3. **HIGH:** Apply this check to `POST /course/:courseAssignmentId` and `POST /import/:courseAssignmentId` in `attendanceRoutes.js`.
