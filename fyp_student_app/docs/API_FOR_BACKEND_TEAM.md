app# Backend Team — API Requirements (Mobile App)

Yeh document web/backend team ko dein. Mobile app **direct database se connect nahi hoti** — sirf **REST API** use karti hai.

---

## Important: Mobile app database attach nahi karti

```
[MySQL Database] ←→ [Backend API (Node/Express)] ←→ [Flutter Mobile App]
```

- Web project already database use karta hai
- Mobile app ko sirf **API URL** chahiye
- Team ko **student ke liye naye API endpoints** banane honge

---

## Backend team se yeh kehna hai

> "Hamari Flutter student app ready hai. Humein student login + read-only data APIs chahiye jo neeche diye gaye endpoints par JSON return karein. Response format: `{ success: true, data: ... }`. Auth: `Authorization: Bearer <JWT>`."

---

## Database tables (reference — data yahan se aayega)

| Mobile screen | Database tables |
|---------------|-----------------|
| Login / Profile | `students`, `student_accounts` (banani hogi), `batches`, `departments` |
| Courses | `enrollments` → `course_assignments` → `courses` → `users` (faculty) |
| Attendance | `attendance` (student_id + course_assignment_id + date + status) |
| Schedule | `class_schedules` + `courses` + `users` |
| Assignments & marks | `assessments` (type=`assignment`) + `grades` (score, remarks) |
| Announcements | `notifications` ya nayi announcements table |

### Key fields mapping

**Student profile API should return:**
```json
{
  "id": "1",
  "name": "Ahsan Ali",
  "email": "student@uni.edu",
  "registration_number": "BS-IT-001",
  "department": "Computer Science",
  "semester": "6th Semester",
  "program": "BS Computer Science"
}
```
Source: `students.first_name + last_name`, `student_id_number`, `batches.name`, `departments.name`

**Courses API should return:**
```json
{
  "course_assignment_id": 1,
  "course_code": "CS-301",
  "course_title": "Data Structures",
  "credit_hours": 3,
  "instructor": "Dr. Khan",
  "attendance_summary": { "percentage": 88.5 }
}
```
Source: `enrollments` + `course_assignments` + `courses` + faculty name from `users`

**Assignments API (read-only — student upload NAHI karta):**
```json
{
  "id": "5",
  "course_code": "CS-301",
  "title": "Assignment 1",
  "description": "...",
  "due_date": "2026-04-15",
  "max_marks": 20,
  "obtained_marks": 18,
  "status": "graded",
  "feedback": "Good work"
}
```
Source: `assessments` WHERE `type` = 'assignment' + `grades.score` + `grades.remarks`

**Schedule API:**
```json
{
  "id": 1,
  "course_code": "CS-301",
  "course_name": "Data Structures",
  "day_of_week": "monday",
  "start_time": "09:00:00",
  "end_time": "10:30:00",
  "instructor": "Dr. Khan",
  "room": "Lab 201"
}
```
Source: `class_schedules` joined with courses and faculty

---

## Required API endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/student-auth/login` | `{ email, password }` → JWT + user |
| GET | `/api/student-auth/me` | Validate token, return user |
| PUT | `/api/student-auth/change-password` | `{ oldPassword, newPassword }` |
| GET | `/api/student-portal/profile` | Student info |
| GET | `/api/student-portal/courses` | Enrolled courses + attendance % |
| GET | `/api/student-portal/schedule` | Weekly timetable |
| GET | `/api/student-portal/courses/:id/attendance` | Per-class attendance log |
| GET | `/api/student-portal/courses/:id/grades` | All assessment scores |
| GET | `/api/student-portal/assignments` | Assignments list (teacher web se add kare) |
| GET | `/api/student-portal/assignments/:id` | Single assignment + marks |
| GET | `/api/student-portal/announcements` | Teacher announcements |

**Note:** Assignment **upload endpoint ki zaroorat nahi** — student sirf marks/details dekhega.

---

## Jab API ready ho

Mobile app mein:
```dart
// lib/core/config/app_config.dart
static const bool useMockData = false;
static const String apiBaseUrl = 'https://your-server.com/api';
```

---

## Student login (jab `student_accounts` table ban jaye)

- **Username:** student ki university **email** (import file wali)
- **Default password:** email mein jo digits hain unke **last 5** (e.g. `arshadahsan388@gmail.com` → `388`, `student12345@uni.edu` → `12345`)
