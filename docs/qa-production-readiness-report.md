# CampusFlow Production QA & Performance Report

Date: 2026-06-25  
Branch: `performance-optimization`  
Environment tested: Local MySQL + local backend on `http://localhost:3100/api`  
Backup created before seed: `backend/backups/fyp_lms-2026-06-25T03-30-26-539Z.sql`

## Executive Summary

CampusFlow is significantly improved for production-scale data after the performance work and QA seeding. Login, paginated list pages, attendance loading, messages, CLO loading, and attendance saving passed with a large local dataset.

Production readiness verdict: **Ready for staging / production rehearsal, not final production until deployment checks are completed.**

Reason: the code passed the local large-data QA run, but Redis, production migrations, and production server load testing still need to be verified on the real deployment server.

## Large Test Data Created

QA seed script: `backend/scripts/qa-seed-large.js`

Generated data:

| Area | Count |
|---|---:|
| QA departments | 10 |
| QA faculty members | 200 |
| QA students | 5,000 |
| QA courses | 500 |
| QA attendance records | 100,000 |
| QA grade records | 50,000 |
| QA messages | 160 |

Total local dataset after seed:

| Area | Count |
|---|---:|
| Departments | 26 |
| Super Admins | 3 |
| Department Admins | 11 |
| Faculty | 201 |
| Students | 5,000 |
| Courses | 503 |
| Batches | 21 |
| Attendance records | 100,050 |
| Grade records | 50,000 |
| Assessments | 1,000 |
| PLOs | 45 |
| CLOs | 1,003 |

## Functional Test Results

| Workflow | Result | Time |
|---|---:|---:|
| Super Admin login | Passed | 102.87ms |
| Department Admin login | Passed | 68.27ms |
| Faculty login | Passed | 64.10ms |
| Super Admin profile restore | Passed | 277.99ms |
| Department Admin profile restore | Passed | 210.89ms |
| Faculty profile restore | Passed | 241.76ms |
| User management pagination/search | Passed | 240.48ms |
| Batch management pagination/search | Passed | 218.56ms |
| Course management pagination/search | Passed | 214.31ms |
| Curriculum pagination/search | Passed | 216.80ms |
| Faculty messages contacts | Passed | 248.79ms |
| Faculty unread messages | Passed | 224.47ms |
| Faculty assigned courses | Passed | 281.84ms |
| Faculty attendance page | Passed | 216.73ms |
| Faculty monthly attendance report | Passed | 240.58ms |
| Faculty assessments page | Passed | 290.67ms |
| Save 50 attendance records | Passed | 232.07ms |
| Global CLO list | Passed | 256.14ms |

## Performance Test Results

Database query timings on large data:

| Query | Time |
|---|---:|
| Login lookup by email | 2.72ms |
| Paginated students search | 1.48ms |
| Attendance date page | 3.04ms |
| Monthly attendance grid source | 2.66ms |
| Dashboard departments count | 4.72ms |

Dashboard API timings:

| Endpoint | Status | Time | Severity |
|---|---:|---:|---|
| `GET /api/dashboard/stats` | 200 | 649.63ms | Low |
| `GET /api/dashboard/attendance-overview` | 200 | 647.51ms | Low |
| `GET /api/dashboard/grade-distribution` | 200 | 637.79ms | Low |

Final audit pass after CLO optimization:

| Endpoint | Status | Time | Severity |
|---|---:|---:|---|
| `GET /api/courses/clos/all` | 200 | 256.14ms | Pass |
| `GET /api/dashboard/stats` | 200 | 642.44ms | Low |
| `GET /api/dashboard/attendance-overview` | 200 | 664.59ms | Low |
| `GET /api/dashboard/grade-distribution` | 200 | 733.29ms | Low |

Concurrent user simulation:

| Metric | Result |
|---|---:|
| Mixed concurrent requests | 50 |
| Failures | 0 |
| Total time | 444.77ms |
| Average response time | 311.32ms |
| p95 response time | 441.49ms |
| Max response time | 441.85ms |

Simulated work:

- Admin user listing/search
- Admin dashboard loading
- Faculty attendance loading
- Faculty message contacts loading

## Bugs Found And Fixed

### Fixed: Global CLO API failed, then optimized

Endpoint: `GET /api/courses/clos/all`  
File: `backend/routes/courseRoutes.js`

Cause:

`courseRoutes.js` still references `clo_plo_mapping`, but the current schema uses `batch_clo_plo_mapping`. The table `clo_plo_mapping` does not exist.

Affected lines:

- `backend/routes/courseRoutes.js:102`
- `backend/routes/courseRoutes.js:522`
- `backend/routes/courseRoutes.js:607`
- `backend/routes/courseRoutes.js:737`

Observed server error:

`Table 'fyp_lms.clo_plo_mapping' doesn't exist`

Fix applied:

- Added `backend/migrations/017_add_clo_plo_mapping.sql`.
- Updated `backend/scripts/qa-seed-large.js` to create/populate the mapping table for QA data.
- Optimized `GET /api/courses/clos/all` in `backend/routes/courseRoutes.js` from N+1 queries to bulk queries.

Result:

- Before fix: `500` error.
- After migration: `200`, but slow at `2587.62ms`.
- After query optimization: `200` in `256.14ms`.

### Medium: Migration history is inconsistent

The live local schema was missing:

- `users.token_version`
- `messages`
- `course_assignment_files`

QA seed added missing schema support locally so tests could run, but production needs proper migrations applied in order.

Files involved:

- `backend/migrations/016_add_token_version.sql`
- `backend/migrations/012_add_messages_table.sql`
- `backend/migrations/010_add_course_assignment_files.sql`

Impact:

- Without `users.token_version`, protected routes can fail after login.
- Without `messages`, admin/faculty chat fails.
- Without `course_assignment_files`, uploaded course material references can fail.

### Low: Dashboard APIs are acceptable but slower than list APIs

Endpoints:

- `GET /api/dashboard/stats`
- `GET /api/dashboard/attendance-overview`
- `GET /api/dashboard/grade-distribution`

Current timings are around 638ms to 650ms locally. This is not crashing, but on production with many departments it should use Redis caching and careful indexes.

### Low: Frontend build warning

Build passed, but Vite reported outdated browser compatibility data:

`Browserslist: browsers data (caniuse-lite) is 6 months old`

Recommended fix:

Run browser database update before final deployment.

## Production Checks

Passed:

- Frontend production build completed.
- Backend syntax checks passed.
- `.env` is ignored by Git.
- No hardcoded production API keys were found in source code.
- Authentication works for Super Admin, Department Admin, and Faculty through real API login.
- Role permission checks passed: Faculty was blocked from admin user-management APIs with `403`.
- Large local data seed completed.
- Pagination/search endpoints handled large data.
- Attendance save uses bulk upsert and passed.
- Concurrent 50-request mixed test passed.
- Global CLO list now passes after migration/query optimization.
- Database query timings were low after indexes.
- Database backup was created before QA seed.
- Login and forgot-password pages showed no horizontal overflow at mobile width.

Needs attention:

- Run all migrations on a clean staging/production database.
- Configure production Redis.
- Run a real server load test after deployment.
- Keep generated QA data out of production unless intentionally used for staging.
- Confirm HTTPS on the final deployment URL.
- Confirm production CORS exactly matches the deployed frontend domain.
- Browser console check for authenticated pages should be repeated on the deployed/staging URL after login.

## Final Checklist Confirmation

| Item | Status | Notes |
|---|---|---|
| No console errors | Partial pass | Public login/forgot pages loaded without new page-load errors. Authenticated browser pages should be rechecked on staging because local browser automation produced intentional failed-login attempts while testing. |
| No exposed `.env` / API keys | Pass | `.env` is ignored by Git and source scan found no production API keys. |
| Authentication and role permissions | Pass | Super Admin, Department Admin, and Faculty logins returned `200`; Faculty was denied admin user APIs with `403`. |
| Database indexes added | Pass | Confirmed indexes on users, attendance, grades, messages, and course assignments. |
| Pagination for large tables | Pass | Users, batches, courses, curricula, students, parents, attendance, assessments, and grades use pagination. |
| Proper error messages | Pass | API returned clear messages such as `Access denied. Admin privileges required.` and login invalid credential messages. |
| Mobile responsive pages | Partial pass | Public auth pages passed 390px width with no horizontal overflow. Authenticated pages should be rechecked on staging with real login session. |
| Backup/database safety | Pass | Backup created before seed: `backend/backups/fyp_lms-2026-06-25T03-30-26-539Z.sql`. |
| HTTPS enabled on deployment | Not locally verifiable | Must be confirmed on final hosting domain. Backend has Helmet/HSTS, but real HTTPS depends on deployment platform/proxy. |

## Recommendation

CampusFlow is **code-level ready for staging/prod rehearsal**, but do **not** call it final production-ready until:

1. Production database migrations are run and verified.
2. Redis is configured in production.
3. A staging load test is run against the actual server.
4. Dashboard APIs are checked again with Redis enabled.
5. Production backups/restore procedure is tested.

## Commands Used

Backup:

```bash
cd backend
DB_HOST=localhost DB_PORT=3306 DB_USER=fyp_user DB_PASS=fyp12345 DB_NAME=fyp_lms npm run backup
```

Seed large QA data:

```bash
cd backend
DB_HOST=localhost DB_PORT=3306 DB_USER=fyp_user DB_PASS=fyp12345 DB_NAME=fyp_lms npm run qa:seed
```

Apply indexes:

```bash
cd backend
DB_HOST=localhost DB_PORT=3306 DB_USER=fyp_user DB_PASS=fyp12345 DB_NAME=fyp_lms npm run db:indexes
```

Start backend test server:

```bash
cd backend
DB_HOST=localhost DB_PORT=3306 DB_USER=fyp_user DB_PASS=fyp12345 DB_NAME=fyp_lms JWT_SECRET=qa-local-secret PORT=3100 npm start
```

Run performance audit:

```bash
cd backend
DB_HOST=localhost DB_PORT=3306 DB_USER=fyp_user DB_PASS=fyp12345 DB_NAME=fyp_lms QA_BASE_URL=http://localhost:3100/api npm run qa:perf
```

Build frontend:

```bash
cd frontend
npm run build
```
