# Session Report: Secure Authentication & WebSocket Migration

**Date:** June 3, 2026  
**Project:** FYP-LMS (Learning Management System)  
**Scope:** Migrate from localStorage-based auth to HTTP-Only cookies + Add real-time WebSocket support

---

## Table of Contents

1. [Objective](#1-objective)
2. [Discussion & Planning Phase](#2-discussion--planning-phase)
3. [Implementation Plans Created](#3-implementation-plans-created)
4. [Plan 1 Execution](#4-plan-1-execution--websocket--auth-migration)
5. [Errors Encountered & Solutions](#5-errors-encountered--solutions)
6. [Files Modified](#6-files-modified)
7. [Current Status & Remaining Work](#7-current-status--remaining-work)
8. [Key Lessons & Decisions](#8-key-lessons--decisions)

---

## 1. Objective

### Primary Goals

1. **Security Migration:** Remove all `localStorage.getItem('token')` and `localStorage.getItem('user')` reads from the frontend. Replace with a centralized `AuthContext` that validates sessions via HTTP-Only cookies.
2. **Session Persistence:** Ensure page refreshes don't lose the user's session — cookies are sent automatically by the browser, and `GET /api/auth/me` restores user state on mount.
3. **Real-Time Updates:** Implement Socket.IO WebSocket infrastructure so admin changes (courses, faculty assignments, etc.) push live to faculty dashboards.
4. **Department Isolation:** WebSocket rooms scoped by `department_id` (`dept_${id}`), ensuring users only see events for their department.
5. **Future Readiness:** Prepare infrastructure for inter-departmental messaging (Plan 2).

---

## 2. Discussion & Planning Phase

### Questions Discussed Before Coding

**Q: If we use WebSockets, do we have to get rid of HTTP?**  
A: No. HTTP handles REST API requests (CRUD), WebSockets handle real-time push notifications. They coexist.

**Q: Which hosting platform should we use?**  
A: Railway or Render for backend (supports WebSockets + MySQL), Vercel for frontend.

| Platform | Free Tier | Paid | WebSocket Support |
|----------|-----------|------|-------------------|
| Railway | $5/mo credit | $5+/mo | Yes |
| Render | 750 hrs/mo | $7+/mo | Yes |
| Vercel | Frontend only | $20/mo | No (serverless) |
| Heroku | No free tier | $7+/mo | Yes |

**Q: Should we migrate all localStorage reads at once?**  
A: Yes — incremental migration would leave the app in a broken half-state.

**Q: Should admin dashboard also get WebSocket updates?**  
A: Yes — both admin and faculty layouts were wired with listeners.

**Q: Should we fix the insecure JWT_SECRET?**  
A: Yes — changed from hardcoded `'KEY'` to a secure 64-char hex in `.env`.

**Q: How does department messaging isolation work?**  
A: On WebSocket connect, the server reads the JWT from the cookie, extracts `department_id`, and auto-joins room `dept_${department_id}`. Events only go to specific rooms.

---

## 3. Implementation Plans Created

### Plan 1: `plan_1_websocket_auth.md` (EXECUTED)
- Phase 1: Backend Auth (cookie-parser, HTTP-Only cookies, /me, /logout)
- Phase 2: Backend WebSocket (socket.js, emitHelper.js, event emission)
- Phase 3: Frontend Auth (AuthContext, api.js, migrate 20+ files)
- Phase 4: Frontend WebSocket (SocketContext, layout listeners)

### Plan 2: `plan_2_messaging.md` (NOT YET EXECUTED)
- Database schema for messages/conversations
- Backend messaging API
- Frontend chat UI
- Department-scoped messaging rooms

---

## 4. Plan 1 Execution — WebSocket + Auth Migration

### Phase 1: Backend Auth Changes — COMPLETE

| Task | Status |
|------|--------|
| Install socket.io + cookie-parser | Done |
| Set secure JWT_SECRET in .env | Done |
| Add cookie-parser to server.js | Done |
| Login sets HTTP-Only cookie | Done |
| verifyToken reads cookie first | Done |
| Add /me and /logout routes | Done |

### Phase 2: Backend WebSocket Setup — COMPLETE

| Task | Status |
|------|--------|
| Create socket.js (auth + room join) | Done |
| Create emitHelper.js | Done |
| Modify server.js (HTTP server + Socket.IO) | Done |
| Add events to courseRoutes.js | Done |
| Add events to batchRoutes.js | Done |

### Phase 3: Frontend Auth Changes — COMPLETE

| Task | Status |
|------|--------|
| Install socket.io-client | Done |
| Update api.js (withCredentials, 401 interceptor) | Done |
| Create AuthContext.jsx | Done |
| Wrap App with AuthProvider | Done |
| Update ProtectedRoute.jsx | Done |
| Update Login.jsx | Done |
| Migrate ALL localStorage reads (20+ files) | Done |

**Files migrated from localStorage to useAuth():**

| Component | File |
|-----------|------|
| Admin Sidebar | `components/common/admin/Sidebar.jsx` |
| Admin Navbar | `components/common/admin/Navbar.jsx` |
| SuperAdmin Sidebar | `components/common/superadmin/Sidebar.jsx` |
| SuperAdmin Navbar | `components/common/superadmin/Navbar.jsx` |
| Staff Sidebar | `components/common/staff/Sidebar.jsx` |
| Staff Navbar | `components/common/staff/Navbar.jsx` |
| Dean Sidebar | `components/common/dean/Sidebar.jsx` |
| Dean Navbar | `components/common/dean/Navbar.jsx` |
| TA Sidebar | `components/common/ta/Sidebar.jsx` |
| TA Navbar | `components/common/ta/Navbar.jsx` |
| Faculty Sidebar | `components/common/faculty/Sidebar.jsx` |
| Faculty Navbar | `components/common/faculty/Navbar.jsx` |
| Admin Dashboard | `pages/admin-pages/Dashboard.jsx` |
| Admin Settings | `pages/admin-pages/Settings.jsx` |
| CreateAccount | `pages/admin-pages/CreateAccount.jsx` |
| SuperAdminPanel | `pages/admin-pages/SuperAdminPanel.jsx` |
| AddCourses | `pages/admin-pages/AddCourses.jsx` |
| AddBatch | `pages/admin-pages/AddBatch.jsx` |
| ManageCurricula | `pages/admin-pages/ManageCurricula.jsx` |

### Phase 4: Frontend WebSocket Integration — COMPLETE

| Task | Status |
|------|--------|
| Create SocketContext.jsx | Done |
| Add SocketProvider to App.jsx | Done |
| Add listeners to FacultyMainLayout | Done |
| Add listeners to AdminMainLayout | Done |

### Build Verification — PASSED

```
$ npx vite build
dist/index.html                   0.47 kB
dist/assets/index-Dkiqj3hL.css   93.90 kB
dist/assets/index-C3VGBOAV.js   910.88 kB
Built in 6.21s — 0 errors
```

---

## 5. Errors Encountered & Solutions

### Error 1: File Upload — 500 Internal Server Error

**What happened:** Uploading a PDF file for course content in the admin batch page showed toast "Failed to upload file". Console showed `POST /api/batches/3/semesters/1/courses/.../upload 500`.

**Root Cause:** The `uploads/course_content/` directory did not exist. Multer tried to write the file to a non-existent folder and threw `ENOENT`.

**Solution:**
1. Created the missing directory manually
2. Added auto-creation logic to prevent recurrence:

```javascript
// batchRoutes.js
import fs from 'fs';
const uploadDir = 'uploads/course_content/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
```

**File changed:** `backend/routes/batchRoutes.js`

---

### Error 2: Save Schedule — 403 Forbidden

**What happened:** Saving a weekly schedule showed toast "Failed to save schedule". Console showed `PUT /api/batches/3/courses/2/schedule 403 (Forbidden)`.

**Root Cause:** The admin was using a **stale cookie** from before the JWT_SECRET migration. The old token was signed with `'KEY'` (the old secret). The middleware had a `|| 'KEY'` fallback that allowed the old token to decode, but the decoded payload had a mismatched `role`. The `isAdmin` middleware rejected it with 403.

**Solution:**
1. **Immediate fix:** Admin logged out and logged back in for a fresh cookie
2. **Permanent fix:** Removed the insecure `|| 'KEY'` fallback from all 4 backend files:

```javascript
// BEFORE (insecure)
jwt.verify(token, process.env.JWT_SECRET || 'KEY');

// AFTER (secure)
jwt.verify(token, process.env.JWT_SECRET);
```

**Files changed:**
- `backend/middleware/auth.js`
- `backend/controllers/authController.js`
- `backend/controllers/adminController.js`
- `backend/controllers/facultyController.js`

---

### Error 3: Assign Course to Batch — 403 Forbidden

**What happened:** Adding a course to a batch semester showed "Failed to add courses". Console showed `POST /api/batches/3/semesters/1/courses 403 (Forbidden)`.

**Root Cause:** Same as Error 2 — the admin account still had the old stale cookie. The user had re-logged the faculty account but not the admin account.

**Solution:** Admin logged out and logged back in. Every user who was logged in before the migration needed one fresh login.

---

### Error 4: Faculty Dashboard Blanked After Course Assignment

**What happened:** When admin assigned a course, the faculty dashboard:
1. Showed the toast "Admin has assigned you a course" (WebSocket worked!)
2. But the course list went blank showing "No Courses Assigned"
3. On page refresh, login page appeared
4. After re-login, courses appeared correctly

**This had THREE sub-causes:**

#### 4a: Query Key Mismatch

The WebSocket handler invalidated `['courses']` and `['assigned']`, but the dashboard uses `['facultyDashboardCourses']`. The invalidation fired but didn't trigger the right refetch.

**Fix:** Updated FacultyMainLayout to invalidate correct keys:
```javascript
// BEFORE (wrong keys)
queryClient.invalidateQueries({ queryKey: ['courses'] });
queryClient.invalidateQueries({ queryKey: ['assigned'] });

// AFTER (correct keys)
queryClient.invalidateQueries({ queryKey: ['facultyDashboardCourses'] });
queryClient.invalidateQueries({ queryKey: ['facultySchedule'] });
```

#### 4b: Same-Browser Cookie Collision

The user was testing admin and faculty in two tabs of the **same browser**. HTTP-Only cookies are browser-wide — the last login overwrites the previous cookie. When admin logged in last, the faculty tab's refetch sent the admin's cookie, which returned 0 courses for the admin user.

**Fix:** Use two different browsers for multi-role testing:

| Admin | Faculty |
|-------|---------|
| Chrome (normal) | Chrome Incognito / Edge / Firefox |

#### 4c: Missing Cookie on Refresh

The faculty had logged in before the migration (no cookie was set). On refresh, `GET /api/auth/me` returned 401 (no cookie) and redirected to login.

**Fix:** After fresh login with the new system, cookie-based sessions persist across refreshes.

---

## 6. Files Modified

### Backend (11 files)

| File | Change |
|------|--------|
| `.env` | Secure JWT_SECRET |
| `server.js` | cookie-parser, HTTP server, Socket.IO |
| `middleware/auth.js` | Cookie-first auth, removed KEY fallback |
| `controllers/authController.js` | Cookie on login, removed KEY fallback |
| `controllers/adminController.js` | Removed KEY fallback |
| `controllers/facultyController.js` | Removed KEY fallback (2 places) |
| `routes/auth.js` | Added /me and /logout endpoints |
| `routes/batchRoutes.js` | Upload dir auto-create, WebSocket events |
| `routes/courseRoutes.js` | WebSocket events on CRUD |
| `utils/socket.js` | **NEW** — Socket.IO server with JWT auth |
| `utils/emitHelper.js` | **NEW** — Department event emission |

### Frontend (28 files)

| File | Change |
|------|--------|
| `services/api.js` | withCredentials, 401 interceptor |
| `context/AuthContext.jsx` | **NEW** — Global auth state |
| `context/SocketContext.jsx` | **NEW** — Socket.IO connection |
| `App.jsx` | AuthProvider + SocketProvider wrappers |
| `components/ProtectedRoute.jsx` | useAuth() |
| `pages/Login.jsx` | AuthContext login() |
| 12x Sidebar/Navbar files | useAuth() migration |
| `pages/admin-pages/Dashboard.jsx` | useAuth() |
| `pages/admin-pages/Settings.jsx` | useAuth(), removed localStorage sync |
| `pages/admin-pages/CreateAccount.jsx` | useAuth() |
| `pages/admin-pages/SuperAdminPanel.jsx` | useAuth() + logout() |
| `pages/admin-pages/AddCourses.jsx` | useAuth(), removed JWT decode |
| `pages/admin-pages/AddBatch.jsx` | useAuth(), removed JWT decode |
| `pages/admin-pages/ManageCurricula.jsx` | useAuth(), removed JWT decode |
| `layout/admin/AdminMainLayout.jsx` | WebSocket listeners |
| `layout/faculty/FacultyMainLayout.jsx` | WebSocket listeners, fixed query keys |
| `pages/faculty-pages/Dashboard.jsx` | retry + refetchOnWindowFocus |

---

## 7. Current Status & Remaining Work

### Completed

- [x] All 4 phases of Plan 1 fully executed
- [x] Build compiles with 0 errors
- [x] All localStorage auth reads removed (grep verified: 0 results)
- [x] HTTP-Only cookie auth working end-to-end
- [x] WebSocket department-scoped rooms working
- [x] Real-time toast notifications on faculty dashboard
- [x] Query invalidation fixed with correct keys
- [x] Upload directory auto-creation
- [x] All insecure JWT_SECRET fallbacks removed

### Pending (Manual Testing)

- [ ] Multi-browser testing (admin Chrome, faculty Incognito)
- [ ] Session expiration after 7 days
- [ ] Production deployment testing (secure cookies)

### Not Started (Plan 2 — Messaging)

- [ ] Database schema for messages/conversations
- [ ] Backend messaging API
- [ ] Frontend chat UI
- [ ] Department-scoped messaging rooms

---

## 8. Key Lessons & Decisions

### Security Improvements

| Before | After |
|--------|-------|
| JWT in localStorage (XSS vulnerable) | JWT in HTTP-Only cookie (invisible to JS) |
| JWT_SECRET fallback `'KEY'` | Secure 64-char hex, no fallback |
| Manual `atob()` JWT decoding in frontend | Server `/me` endpoint returns user data |
| `localStorage.removeItem()` for logout | `POST /logout` clears cookie server-side |
| No session restore on refresh | `GET /me` auto-restores from cookie |

### Architecture Pattern: Push-to-Invalidate

WebSocket events don't carry data — they signal "something changed." The client then refetches via HTTP using React Query invalidation. This keeps data flow simple and consistent.

### Testing Gotcha: Cookie Collision

HTTP-Only cookies are shared across all tabs in the same browser. For multi-role testing, always use separate browser profiles or Incognito windows. This is a security feature, not a bug.

---

*Session report — June 3, 2026*
