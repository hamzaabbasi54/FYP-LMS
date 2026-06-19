# ACCESS_CONTROL Fix Plan

## Changes

- `backend/middleware/facultyScope.js` (NEW) — Create middleware to verify if a faculty member owns a specific `course_assignment` or `assessment`.
- `backend/routes/assessmentRoutes.js` — Apply `scopeFaculty` to:
  - `POST /` (using `req.body.course_assignment_id`)
  - `PUT /:id` (using `req.params.id` to look up assessment)
  - `DELETE /:id` (using `req.params.id`)
- `backend/routes/attendanceRoutes.js` — Apply `scopeFaculty` to:
  - `POST /course/:courseAssignmentId`
  - `POST /import/:courseAssignmentId`
  - `PUT /:id`

## New files

- `backend/middleware/facultyScope.js`

## Verification goals

- [ ] A faculty member cannot create an assessment for a `course_assignment_id` they do not own (returns 403)
- [ ] A faculty member cannot update an assessment they do not own (returns 403)
- [ ] A faculty member cannot delete an assessment they do not own (returns 403)
- [ ] A faculty member cannot submit attendance for a `course_assignment_id` they do not own (returns 403)

## Manual verification (for the human)

- Log in as a faculty member.
- Attempt to PUT to `/api/assessments/1` (where 1 is an assessment belonging to another faculty member) and ensure it fails with 403.
