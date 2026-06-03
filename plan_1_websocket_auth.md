# Plan 1: HTTP-Only Cookie Auth + WebSocket Real-Time Infrastructure

## Project Context

**Project**: FYP-LMS (University Learning Management System)
**Stack**: React 19 + Vite (frontend) | Express 5 + MySQL via mysql2/promise (backend)
**Repo root**: `d:\FYP-LMS` with `frontend/` and `backend/` directories
**Database**: Aiven-hosted MySQL (`defaultdb`)
**Roles**: `super_admin`, `deptadmin` (department admin), `faculty`

### Current Auth Flow (BROKEN — causes logout on refresh)
1. `Login.jsx` calls `POST /api/auth/login` with email, password, role
2. Backend `authController.login()` validates credentials, generates JWT (7-day expiry) with payload: `{ id, email, role, faculty, department, faculty_id, department_id }`
3. Frontend stores `token` and `user` object in `localStorage`
4. `api.js` axios interceptor reads `localStorage.getItem('token')` and adds `Authorization: Bearer` header
5. `ProtectedRoute.jsx` reads `localStorage` directly to check auth
6. **Problem**: On refresh, React state resets. localStorage IS persistent, but the app has no loading gate — routes render before localStorage is reliably read, causing flicker/redirect.

### Goal
1. **Replace localStorage token storage with HTTP-Only cookies** (secure, XSS-proof)
2. **Add `GET /api/auth/me` endpoint** so frontend can verify auth on page load
3. **Add Socket.IO WebSockets** for real-time push notifications when admin changes data
4. **Department-scoped rooms** so only relevant department users get notifications
5. **Both admin AND faculty** connect to WebSocket (needed for future messaging feature)

---

## PHASE 1: Backend Auth Changes

### 1.1 Install dependencies
```bash
cd d:\FYP-LMS\backend
npm install socket.io cookie-parser
```

### 1.2 Fix JWT_SECRET in `.env`
**File**: `backend/.env`
- Change `JWT_SECRET=KEY` to a secure random 64-char hex string
- Add `NODE_ENV=development`

### 1.3 Add cookie-parser middleware
**File**: `backend/server.js`
- Add `import cookieParser from 'cookie-parser';`
- Add `app.use(cookieParser());` BEFORE route mounting
- Keep existing CORS config but ensure `credentials: true` is already set (it is)

### 1.4 Modify login to set HTTP-Only cookie
**File**: `backend/controllers/authController.js`
- In the `login()` function, after generating the JWT token (line ~210-222):
  - Add `res.cookie()` call to set the token as HTTP-Only cookie
  - Still return `data` (user profile) in JSON body, but **remove `token` from JSON response**
  - Cookie config: `{ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }`

### 1.5 Update verifyToken middleware to read cookie
**File**: `backend/middleware/auth.js`
- In `verifyToken()`, change token extraction to check BOTH cookie and header:
  ```js
  token = req.cookies?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
  ```
  This ensures backward compatibility.

### 1.6 Add `/me` and `/logout` routes
**File**: `backend/routes/auth.js`

**Add `GET /api/auth/me`** (protected by verifyToken):
- Reuses same logic as `getProfile` — queries user from DB using `req.user.id` from decoded JWT
- Returns user object with: `id, fullName, email, role, faculty, department, faculty_id, department_id`
- If token invalid/expired → returns 401 (handled by verifyToken)

**Add `POST /api/auth/logout`**:
- Clears the `token` cookie: `res.clearCookie('token', { httpOnly: true, secure: ..., sameSite: ... })`
- Returns `{ success: true, message: 'Logged out' }`
- This is a PUBLIC route (no verifyToken needed — user might have expired token)

---

## PHASE 2: Backend WebSocket Setup

### 2.1 Create Socket.IO module
**File**: `backend/utils/socket.js` (NEW)

```js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';  // built-in to Node, or use cookie-parser's logic

let io;

export const initSocket = (httpServer, allowedOrigins) => {
    io = new Server(httpServer, {
        cors: { origin: allowedOrigins, credentials: true }
    });

    io.on('connection', (socket) => {
        // Authenticate via HTTP-Only cookie from handshake headers
        try {
            const cookies = cookie.parse(socket.request.headers.cookie || '');
            const token = cookies.token;
            if (!token) { socket.disconnect(); return; }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;

            // Auto-join department room
            if (decoded.department_id) {
                socket.join(`dept_${decoded.department_id}`);
                console.log(`Socket: ${decoded.email} joined dept_${decoded.department_id}`);
            }
        } catch (err) {
            console.error('Socket auth failed:', err.message);
            socket.disconnect();
        }

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.user?.email || 'unknown'}`);
        });
    });

    return io;
};

export const getIO = () => io;
```

### 2.2 Create emit helper
**File**: `backend/utils/emitHelper.js` (NEW)

```js
import { getIO } from './socket.js';

export const emitToDepartment = (departmentId, event, data) => {
    const io = getIO();
    if (io && departmentId) {
        io.to(`dept_${departmentId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
};
```

### 2.3 Modify server.js to use HTTP server + Socket.IO
**File**: `backend/server.js`

Key changes:
- Add `import http from 'http';`
- Add `import cookieParser from 'cookie-parser';`
- Add `import { initSocket } from './utils/socket.js';`
- Add `app.use(cookieParser());` before routes
- Replace `app.listen(PORT, ...)` with:
  ```js
  const server = http.createServer(app);
  initSocket(server, allowedOrigins);
  server.listen(PORT, () => { ... });
  ```

### 2.4 Add WebSocket events to admin mutation routes

**File**: `backend/routes/courseRoutes.js`
- Add `import { emitToDepartment } from '../utils/emitHelper.js';` at top
- After successful `POST /` (create course): Emit `course_created` to the course's `department_id`
- After successful `PUT /:id` (update course): Query the course's `department_id`, emit `course_updated`
- After successful `DELETE /:id` (delete course): Emit `course_deleted`
- After successful `PUT /:id/syllabus`: Emit `syllabus_updated`
- After successful `POST /assign`: Emit `faculty_assigned`

**File**: `backend/routes/batchRoutes.js`
- Same import of `emitToDepartment`
- After `PUT /:id` (update batch): Emit `batch_updated` — batch has `department_id` column
- After `POST /:batchId/semesters/:sem/courses/:courseId/assign`: Emit `faculty_assigned`

**Event data format**:
```js
emitToDepartment(department_id, 'course_updated', {
    courseId: req.params.id,
    title: title || 'a course',
    message: 'Course content updated by Admin',
    updatedBy: req.user.email
});
```

---

## PHASE 3: Frontend Auth Changes

### 3.1 Install dependency
```bash
cd d:\FYP-LMS\frontend
npm install socket.io-client
```

### 3.2 Update axios instance
**File**: `frontend/src/services/api.js`

Changes:
1. Add `withCredentials: true` to axios create config (tells browser to send cookies):
   ```js
   const api = axios.create({
       baseURL: API_BASE_URL,
       withCredentials: true,
       headers: { 'Content-Type': 'application/json' }
   });
   ```
2. **Remove** the request interceptor that reads `localStorage.getItem('token')` and sets Authorization header (lines 42-53) — cookies are sent automatically
3. Update the 401 response interceptor: instead of `localStorage.removeItem('token')`, dispatch a custom event:
   ```js
   window.dispatchEvent(new Event('auth:logout'));
   ```
4. Add new auth API methods:
   ```js
   getMe: async () => { const r = await api.get('/auth/me'); return r.data; },
   logout: async () => { const r = await api.post('/auth/logout'); return r.data; },
   ```
5. Remove `token` from `login` response handling (backend no longer sends it in body)

### 3.3 Create AuthContext
**File**: `frontend/src/context/AuthContext.jsx` (NEW — currently empty)

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // On mount: check if user is authenticated via cookie
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await authApi.getMe();
                if (data.success) setUser(data.data);
            } catch (err) {
                // 401 = not logged in, that's fine
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();

        // Listen for forced logout from axios interceptor
        const handleForceLogout = () => { setUser(null); navigate('/'); };
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, []);

    const login = async (email, password, role) => {
        const data = await authApi.login(email, password, role);
        if (data.success) setUser(data.data);
        return data;
    };

    const logout = async () => {
        try { await authApi.logout(); } catch {}
        setUser(null);
        localStorage.removeItem('selectedFacultyCourse');
        navigate('/');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### 3.4 Wrap App with AuthProvider
**File**: `frontend/src/App.jsx`
- Add `import { AuthProvider } from "./context/AuthContext.jsx";`
- Wrap inside `<QueryClientProvider>`: `<AuthProvider>...</AuthProvider>`

### 3.5 Update ProtectedRoute
**File**: `frontend/src/components/ProtectedRoute.jsx`
- Replace localStorage reads with `useAuth()`:
  ```jsx
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  // role check using user.role
  ```

### 3.6 Update Login.jsx
**File**: `frontend/src/pages/login/Login.jsx`
- Import and use `useAuth()` hook
- Replace `handleSubmit` to use `const { login } = useAuth()`:
  ```js
  const data = await login(formData.email, formData.password, formData.role);
  if (data.success) navigate(redirectMap[data.data.role] || '/');
  ```
- Remove all `localStorage.setItem('token', ...)` and `localStorage.setItem('user', ...)`

### 3.7 Migrate ALL localStorage.getItem('user') reads
Replace `JSON.parse(localStorage.getItem('user') || '{}')` with `useAuth().user` in these files:

| File | Line | Current |
|---|---|---|
| `components/common/faculty/Sidebar.jsx` | 12 | `localStorage.getItem('user')` |
| `components/common/faculty/Navbar.jsx` | 125 | `localStorage.getItem('user')` |
| `components/common/admin/Sidebar.jsx` | 9 | `localStorage.getItem('user')` |
| `components/common/admin/Navbar.jsx` | 7 | `localStorage.getItem('user')` |
| `components/common/superadmin/Sidebar.jsx` | 7 | `localStorage.getItem('user')` |
| `components/common/superadmin/Navbar.jsx` | 7 | `localStorage.getItem('user')` |
| `components/common/staff/Sidebar.jsx` | 20 | `localStorage.getItem('user')` |
| `components/common/staff/Navbar.jsx` | 7 | `localStorage.getItem('user')` |
| `components/common/dean/Sidebar.jsx` | 7 | `localStorage.getItem('user')` |
| `components/common/dean/Navbar.jsx` | 7 | `localStorage.getItem('user')` |
| `components/layout/faculty/FacultyMainLayout.jsx` | 8 | `localStorage.getItem('user')` |
| `pages/admin-pages/Dashboard.jsx` | 9 | `localStorage.getItem('user')` |
| `pages/admin-pages/Settings.jsx` | 6,29,46 | `localStorage.getItem('user')` |
| `pages/admin-pages/CreateAccount.jsx` | 60 | `localStorage.getItem('user')` |
| `pages/admin-pages/ManageCurricula.jsx` | 9-10 | `localStorage.getItem('user')` + token |
| `pages/admin-pages/AddCourses.jsx` | 18-19 | `localStorage.getItem('user')` + token |
| `pages/admin-pages/AddBatch.jsx` | 10-11 | `localStorage.getItem('user')` + token |
| `pages/admin-pages/SuperAdminPanel.jsx` | 8 | `localStorage.getItem('user')` |

Also update ALL `handleLogout` functions in Sidebar components to use `useAuth().logout()` instead of manually clearing localStorage.

Also remove `localStorage.getItem('token')` reads — with cookies, the token is never accessed by JS.

---

## PHASE 4: Frontend WebSocket Integration

### 4.1 Create SocketContext
**File**: `frontend/src/context/SocketContext.jsx` (NEW)

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) return;

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Extract origin (remove /api suffix if present)
        const socketUrl = API_BASE.replace(/\/api$/, '');

        const newSocket = io(socketUrl, {
            withCredentials: true,  // sends HTTP-Only cookie
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => console.log('Socket connected'));
        newSocket.on('connect_error', (err) => console.error('Socket error:', err.message));

        setSocket(newSocket);

        return () => { newSocket.disconnect(); setSocket(null); };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
```

### 4.2 Add SocketProvider to App.jsx
**File**: `frontend/src/App.jsx`
- Import `SocketProvider`
- Wrap INSIDE `<AuthProvider>` but OUTSIDE `<Routes>`:
  ```jsx
  <AuthProvider>
      <SocketProvider>
          <Routes>...</Routes>
      </SocketProvider>
  </AuthProvider>
  ```

### 4.3 Add socket event listeners to layouts
**File**: `frontend/src/components/layout/faculty/FacultyMainLayout.jsx`
- Import `useSocket` and `useQueryClient` from react-query
- Import `toast` from react-toastify
- Inside the component, add:
  ```jsx
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
      if (!socket) return;
      const events = ['course_updated', 'course_created', 'course_deleted',
                       'syllabus_updated', 'faculty_assigned', 'batch_updated'];
      const handler = (data) => {
          toast.info(data.message || 'Content updated by Admin');
          queryClient.invalidateQueries({ queryKey: ['courses'] });
          queryClient.invalidateQueries({ queryKey: ['assigned'] });
      };
      events.forEach(e => socket.on(e, handler));
      return () => events.forEach(e => socket.off(e, handler));
  }, [socket, queryClient]);
  ```

**File**: `frontend/src/components/layout/admin/AdminMainLayout.jsx`
- Same pattern — listen for events and invalidate relevant queries
- This is needed for future messaging support

---

## Verification Steps

1. **Login**: POST to `/api/auth/login` → check response has NO `token` field → check browser cookies shows `token` with HttpOnly flag
2. **Refresh**: Hit F5 on faculty dashboard → user stays logged in (GET `/api/auth/me` returns user)
3. **Logout**: Click logout → cookie cleared → redirect to `/`
4. **WebSocket**: Check Network > WS tab → connection established → backend logs "joined dept_X"
5. **Real-time**: Admin updates course → Faculty in same dept gets toast → Faculty in different dept gets nothing
6. **Security**: Open DevTools console → `document.cookie` should NOT show the token (HttpOnly)
