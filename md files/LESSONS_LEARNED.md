# FYP-LMS: Lessons Learned for AI Agents

> **Purpose**: This document captures common pitfalls found during bug-fixing sessions.  
> AI agents MUST read this file before making changes to prevent repeating these mistakes.

---

## 1. NEVER Mismatch Frontend URL and Backend Route Path

### Rule
When modifying an API URL in `frontend/src/services/api.js`, always verify the exact backend route path first.

### What Happened
A previous AI agent changed the upload URL from `/upload` to `/files` in `api.js`, but the backend route in `batchRoutes.js` was still defined as:
```js
router.post('/:batchId/semesters/:semesterNumber/courses/:courseId/upload', ...)
```
This caused all file uploads to hit a 404.

### How to Prevent
1. **Search the backend route file** before changing any frontend URL.
2. Use `grep` to find the exact route pattern: `grep "courseId.*upload\|courseId.*files" backend/routes/batchRoutes.js`
3. If both need changing, change the backend route AND the frontend URL in the same commit.

---

## 2. NEVER Send Raw Arrays When Backend Expects Named Object Keys

### Rule
Always check what `req.body` destructuring the backend uses before sending data from the frontend.

### What Happened
Frontend sent a raw array:
```js
batchApi.saveCourseSchedule(batchId, courseId, activeEntries) // activeEntries = [{...}, {...}]
```
Backend expected:
```js
const { schedule } = req.body; // schedule is undefined when body IS the array
```
Result: `schedule` is `undefined`, and the route returns 400 "schedule array is required".

### How to Prevent
1. Before modifying any API call, **read the backend route handler** to see what keys it destructures from `req.body`.
2. Common pattern: Backend uses `const { schedule } = req.body` → Frontend must send `{ schedule: [...] }`.

---

## 3. NEVER Have Duplicate Express Routes for the Same Path Pattern

### Rule
Express matches routes in definition order. Having two routes with the same HTTP method and path pattern means the second one is **dead code** — it will never execute.

### What Happened
`batchRoutes.js` had TWO delete routes:
```js
// Route A (line 372) — reached first, checks affectedRows
router.delete('/:id/semesters/:semNum/courses/:courseId', ...)

// Route B (line 519) — NEVER reached, always returns 200
router.delete('/:batchId/semesters/:semesterNumber/courses/:courseId', ...)
```
Despite different param names (`id` vs `batchId`), these match the same URL pattern.

### How to Prevent
1. Before adding a new route, **search the entire file** for existing routes with the same method + path pattern.
2. Use: `grep "router.delete.*semesters.*courses" backend/routes/batchRoutes.js`
3. If found, modify the existing route rather than adding a new one.

---

## 4. ALWAYS Use Parameterized Queries for String Comparisons in SQL

### Rule
Never hardcode string values with double quotes in SQL template strings. Use `?` placeholders.

### What Happened
```js
whereClause += ' AND u.role != "super_admin"'; // BAD: double quotes in SQL
```
In MySQL with `ANSI_QUOTES` sql_mode enabled, `"super_admin"` is treated as a **column name** (identifier), not a string literal, causing query failure.

### How to Prevent
Always use parameterized queries:
```js
whereClause += ' AND u.role != ?';
params.push('super_admin');
```

---

## 5. ALWAYS Import What You Use (Frontend Component Imports)

### Rule
If a component references an API service (e.g., `departmentApi.getAllPLOs()`), that service MUST be in the component's import statement.

### What Happened
`BatchDetails.jsx` used `departmentApi.getAllPLOs()` but only imported:
```js
import { batchApi, curriculumApi, courseApi, obeApi } from '../../services/api';
// Missing: departmentApi
```
Clicking "Manage PLOs" crashed with `ReferenceError: departmentApi is not defined`.

### How to Prevent
1. After adding any API call, **check the import line** at the top of the file.
2. Search for usage: `grep "departmentApi" BatchDetails.jsx` — if found, ensure it's imported.

---

## 6. Handle "Copy-on-Write" for Inherited Data

### Rule
When the UI displays data from a fallback source (e.g., curriculum blueprint), any mutation (add/delete) must first **materialize** the data into the mutable table.

### What Happened
- The GET endpoint for batch courses had a fallback: if `batch_semester_courses` was empty, show courses from the curriculum blueprint.
- The DELETE endpoint only deleted from `batch_semester_courses`.
- If `batch_semester_courses` was empty (e.g., after a data wipe), the DELETE returned 404 because the row didn't exist.
- The UI showed courses (from fallback) that couldn't be deleted.

### How to Prevent
Use the **copy-on-write pattern**: Before any mutation, check if the mutable table is empty. If so, copy all rows from the source (blueprint) into the mutable table within a transaction, then perform the mutation.

---

## 7. Data Wipes Break Materialized Views

### Rule
If `wipe-data.js` or any migration clears tables, remember that `batch_semester_courses` needs to be re-populated from curricula.

### What Happened
Running `wipe-data.js` emptied `batch_semester_courses`. The UI still showed courses (via fallback), but all mutations failed.

### How to Prevent
After any data wipe that affects `batch_semester_courses`, either:
1. Ensure the copy-on-write pattern exists in all mutation routes (now implemented).
2. Or re-run the batch creation flow which copies curriculum courses on creation.

---

## Key Files & Their Responsibilities

| File | What It Does | Common Pitfalls |
|------|-------------|-----------------|
| `frontend/src/services/api.js` | All API service definitions | URL must match backend route exactly |
| `backend/routes/batchRoutes.js` | 900+ lines, batch CRUD + schedule + upload + PLOs | Watch for duplicate routes, check `req.body` shape |
| `backend/routes/auth.js` | Auth + user management | Use parameterized SQL, respect role scoping |
| `frontend/src/pages/admin-pages/BatchDetails.jsx` | Batch detail page | Must import all used API services |
| `frontend/src/pages/admin-pages/BatchCourseSchedule.jsx` | Schedule + faculty + upload | Data shape must match backend destructuring |

---

## Quick Debugging Checklist

When a frontend action shows a toast error:
1. Open browser DevTools → Network tab → find the failed request
2. Note the HTTP status code:
   - **400**: Check `req.body` shape mismatch (Rule 2)
   - **404**: Check URL path mismatch (Rule 1) or missing data (Rule 6)
   - **403**: Check middleware role requirements
   - **500**: Check backend console for SQL errors (Rule 4)
3. Find the backend route handler and trace the logic
4. Check for duplicate routes (Rule 3)
