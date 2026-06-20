# Mobile App Integration Guide: FYP-LMS Student Portal

Welcome to the FYP-LMS Student Portal integration guide! This document explains how the backend system is structured to support the new mobile application, how authentication works, and how you will communicate with the API to retrieve student data.

---

## 1. System Overview & Architecture

The FYP-LMS backend was originally designed for administrators and faculty to manage the university's operations. To support the mobile app, we have built a **dedicated, read-only API layer** specifically for students.

### Key Architectural Decisions:
*   **Isolated Authentication:** Students exist in a separate `student_accounts` table, completely isolated from the admin/faculty `users` table. This ensures that a compromised student account cannot access administrative features.
*   **Read-Only Endpoints:** All `/api/student-portal/*` endpoints are strictly `GET` requests (read-only). Students cannot modify courses, attendance, or grades.
*   **High Performance:** The backend uses Redis caching for session validation (`token_version`) and relies on highly optimized, indexed database queries. The system is designed to comfortably handle 5,000+ concurrent students checking their schedules or attendance simultaneously.
*   **Auto-Provisioning:** You do not need to build a "Sign Up" screen. When the university administration imports a batch of students via Excel, the backend automatically generates their accounts.

---

## 2. Authentication Flow

The mobile app will use **JSON Web Tokens (JWT)** sent via the `Authorization` header. This is the industry standard for mobile applications.

### 2.1. Initial Login Credentials
When a student's account is created by the admin, their initial credentials are:
*   **Email:** The email provided to the university.
*   **Password:** The **last 5 characters** of their Roll Number (Student ID Number).
    *   *Example:* If the roll number is `BS-IT-001`, the initial password is `T-001`.

### 2.2. The Login Process
1.  The app sends a `POST /api/student-auth/login` request containing the `email` and `password`.
2.  The backend verifies the credentials and returns a JWT in the response body.
3.  The mobile app **must store this JWT securely** (e.g., in iOS Keychain or Android EncryptedSharedPreferences).

### 2.3. Making Authenticated Requests
For all subsequent requests to the API, the mobile app must include the JWT in the HTTP headers:
```http
Authorization: Bearer <your_jwt_token_here>
```

### 2.4. Session Invalidation
If a student changes their password or an administrator deactivates their account, the backend increments a `token_version` in the database. The active JWT will immediately become invalid, and the backend will return a `401 Unauthorized` response. Your app should catch `401` errors and redirect the user back to the login screen.

---

## 3. Available API Endpoints

The API is split into two prefixes: Auth and Portal.

### Authentication Endpoints (`/api/student-auth`)

| Endpoint | Method | Purpose | Payload |
| :--- | :--- | :--- | :--- |
| `/login` | `POST` | Authenticate and retrieve JWT | `{ "email": "...", "password": "..." }` |
| `/logout` | `POST` | End the session | *None* |
| `/me` | `GET` | Validate the current token | *None* (Requires Bearer Token) |
| `/change-password`| `PUT` | Allow student to change their password| `{ "oldPassword": "...", "newPassword": "..." }` |

### Portal Endpoints (`/api/student-portal`)
*All these endpoints require the Bearer Token.*

| Endpoint | Method | Purpose | Returns |
| :--- | :--- | :--- | :--- |
| `/profile` | `GET` | Get the student's demographic info | Name, Roll No., Batch Name, Department |
| `/courses` | `GET` | List enrolled courses for the current semester| Course codes, titles, instructors, credit hours |
| `/schedule`| `GET` | Retrieve the weekly class timetable | Course details, timings, days, faculty names |
| `/attendance/summary`| `GET` | Overview of attendance across all courses | Total present, absent, late counts per course |
| `/courses/:courseAssignmentId/attendance` | `GET` | Detailed attendance log for one specific course | Array of dates and status (`present`/`absent`/`late`) |
| `/courses/:courseAssignmentId/grades` | `GET` | Assessment scores for a specific course | Quiz/Midterm/Final scores, max scores, remarks |

---

## 4. Next Steps for the App Team

1.  **Build the Login Interface:** Create the UI for Email/Password login. Remember to instruct users that their initial password is the last 5 characters of their roll number.
2.  **Implement Secure Storage:** Set up secure storage on the device to hold the JWT token returned by the login endpoint.
3.  **Configure API Client (e.g., Axios/Fetch):** Set up a global interceptor in your HTTP client that automatically attaches `Authorization: Bearer <token>` to every request aimed at the backend.
4.  **Handle 401 Interceptors:** Ensure your app gracefully logs the user out and clears the stored token if the API returns a `401 Unauthorized`.
5.  **Design the Dashboard:** Map the data from `/courses`, `/attendance/summary`, and `/courses/:id/grades` into your UI components.
