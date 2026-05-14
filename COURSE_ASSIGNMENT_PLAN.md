# Course Assignment & Faculty Notification Plan

This document outlines the detailed steps to implement bulk course assignments, semester-based assignment popups, and the faculty notification system.

## 1. Database Schema Updates
**Goal:** Support persistent notifications (red dot and toast on login).
- **Action**: Add a new `notifications` table to `backend/schema.sql`.
- **Schema**:
  ```sql
  CREATE TABLE notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  ```

## 2. Backend API Updates
**Goal:** Handle notifications and bulk assignments.
- **Action 1**: Create `backend/routes/notificationRoutes.js` with endpoints:
  - `GET /api/notifications` (Fetch user's notifications)
  - `PUT /api/notifications/read-all` (Mark all as read)
- **Action 2**: Update `backend/routes/courseRoutes.js` (`/assign` endpoint).
  - Modify it to accept an array of `course_ids`.
  - When assigning, loop through the courses, insert into `course_assignments`, and automatically generate a new record in the `notifications` table for the target `faculty_id`.

## 3. Frontend: Bulk Course Assignment (`CourseAssignment.jsx`)
**Goal:** Assign multiple courses at once.
- **State Update**: Change `selectedCourse` from a single value to an array `selectedCourses`.
- **UI Update**: Change the circular radio buttons next to "Available Courses" into multi-select Checkboxes.
- **Submission**: On "Assign", send the array of selected courses and the selected faculty member to the backend.

## 4. Frontend: Semester-Based Assignment Popups (`SemesterCourses.jsx`)
**Goal:** Assign faculty directly from the batch's semester view.
- **Action 1 (Course Details Modal)**: 
  - Make course rows clickable.
  - Open a popup showing course details (Credit hours, Prerequisites, Description).
- **Action 2 (Assignment Modal)**: 
  - If the course is "Unassigned", show an "Assign Faculty" button in the details modal.
  - Clicking it opens a second popup containing a list of faculty members.
  - Include a search bar (`<input type="text">`) to filter the faculty list.
- **Submission**: Clicking a faculty member assigns them to that specific course and updates the UI to show "Assigned".

## 5. Frontend: Faculty Dashboard Notifications
**Goal:** Alert faculty of new assignments via toasts and a red dot.
- **API Setup**: Add `notificationApi` to `frontend/src/services/api.js`.
- **Navbar Integration (`Navbar.jsx`)**:
  - Fetch notifications on component mount (`useEffect`).
  - Add a Bell icon to the header.
  - If there are any notifications where `is_read === false`, display a red dot over the Bell.
  - Display unread notifications as a Toast popup (`toast.info`) upon login.
- **Dropdown Logic**: Clicking the Bell icon opens a dropdown to read the notifications and fires the `read-all` API endpoint to clear the red dot.
