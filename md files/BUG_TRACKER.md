# FYP-LMS Bug Tracker & Fix History

> **Purpose**: This file tracks all active bugs, their root causes, affected files, and solutions.  
> When the AI agent loses context, it should read THIS file first to resume work without re-reading the entire codebase.

---

## Status Legend
- `[ ]` Not started
- `[/]` In progress
- `[x]` Fixed & verified

---

## BUG 1: Schedule Saving Fails — `[x]` FIXED
**File Changed**: `frontend/src/pages/admin-pages/BatchCourseSchedule.jsx` line 182  
**Root Cause**: Frontend sent raw array `activeEntries` but backend expected `req.body.schedule` (object with `schedule` key).  
**Fix**: Changed `saveCourseSchedule(batchId, courseId, activeEntries)` → `saveCourseSchedule(batchId, courseId, { schedule: activeEntries })`

---

## BUG 2: File Upload Fails — `[x]` FIXED
**File Changed**: `frontend/src/services/api.js` line 249  
**Root Cause**: A previous AI fix incorrectly changed the URL from `/upload` to `/files`. Backend route is `/:batchId/semesters/:semesterNumber/courses/:courseId/upload`.  
**Fix**: Reverted URL back from `/files` to `/upload`

---

## BUG 3: Course Removal from Batch Fails — `[x]` FIXED
**Files Changed**: `backend/routes/batchRoutes.js`  
**Root Cause (TWO problems)**:
1. **Copy-on-write missing**: The GET endpoint shows courses from the curriculum blueprint via fallback when `batch_semester_courses` is empty, but the DELETE only targets `batch_semester_courses`. So UI showed courses that didn't exist in the table.
2. **Duplicate routes**: Two identical route patterns at different line numbers (one robust, one basic). The earlier route was matched by Express.

**Fix**: 
- Rewrote DELETE route with copy-on-write: if `batch_semester_courses` is empty for the batch, materialize ALL curriculum courses into it first (within a transaction), then delete the target.
- Removed the duplicate route block (lines ~529-565).

---

## BUG 4: Manage Users Shows 0 Users — `[x]` FIXED
**File Changed**: `backend/routes/auth.js` (GET /users endpoint, line ~248)  
**Root Cause**: SQL used `u.role != "super_admin"` with double quotes, which breaks in MySQL with `ANSI_QUOTES` sql_mode. Also, the user wanted deptadmin to see ONLY faculty they manage (not other admins).  
**Fix**: 
- Added `AND u.role = ?` with parameterized `'faculty'` value
- Kept department scoping via `department_id` and `user_departments` table
- Excluded the requesting admin's own account (`AND u.id != ?`)

---

## BUG 5: Manage PLOs Button Not Working — `[x]` FIXED
**File Changed**: `frontend/src/pages/admin-pages/BatchDetails.jsx` line 4  
**Root Cause**: `departmentApi` was used at line ~134 for `departmentApi.getAllPLOs()` but was never imported. Only `batchApi, curriculumApi, courseApi, obeApi` were imported.  
**Fix**: Added `departmentApi` to the import statement.

---

## Files Quick Reference

| File | Role |
|------|------|
| `frontend/src/services/api.js` | All API service definitions |
| `frontend/src/pages/admin-pages/BatchDetails.jsx` | Batch detail page (course list, PLO modal) |
| `frontend/src/pages/admin-pages/BatchCourseSchedule.jsx` | Course schedule, faculty assign, file upload |
| `frontend/src/pages/admin-pages/ManageUsers.jsx` | User listing page |
| `frontend/src/pages/admin-pages/ManagePLOs.jsx` | Global PLOs management page |
| `backend/routes/batchRoutes.js` | Batch CRUD, courses, schedule, upload, PLOs |
| `backend/routes/auth.js` | Auth, user CRUD (GET /users at line ~248) |
| `backend/routes/departmentRoutes.js` | Department CRUD, PLOs CRUD |
| `backend/controllers/approvalController.js` | getUsersByRole (faculty dropdown) |

---

## Current Status: ALL 5 BUGS FIXED ✅
