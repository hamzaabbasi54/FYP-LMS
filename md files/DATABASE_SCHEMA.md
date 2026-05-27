# FYP-LMS: Database Schema Overview

This document provides a high-level overview of the MySQL database schema to provide context on how entities relate to each other.

## Core Hierarchy
1. **`faculties`**: Top-level academic units.
2. **`departments`**: Belong to a faculty.
3. **`users`**: Defines staff. Roles: `deptadmin`, `faculty`. Tied to departments/faculties.
4. **`students`**: Tied to a batch.
5. **`parents`**: Tied to students.

## Academic Structure
- **`batches`**: A specific intake of students (e.g., "Fall 2023 - CS"). Tied to a department and (optionally) a `curriculum_id`.
- **`semesters`**: Belong to a batch (e.g., Semester 1, Semester 2).
- **`courses`**: Global catalog of courses, tied to departments. Have prerequisite self-joins (`course_prerequisites`).
- **`course_assignments`**: Links a `course` to a `semester` and optionally assigns a `faculty` member to teach it.
- **`enrollments`**: Links a `student` to a `course_assignment` (i.e., student taking a specific class).
- **`class_schedules`**: Links a `batch`, `course`, and `faculty` to specific days of the week, times, and shifts (morning/evening).

## Curriculum & Customization
- **`curricula`**: Master blueprints for a degree program.
- **`curriculum_semesters`**: The semester structure within a blueprint.
- **`curriculum_semester_courses`**: The courses that belong to a curriculum semester (core/elective).
- **`batch_semester_courses`**: Junction table allowing a specific batch to override or adopt courses for its semesters independently of the master curriculum.

## Outcome-Based Education (OBE)
- **`plos`**: Program Learning Outcomes (tied to departments).
- **`clos`**: Course Learning Outcomes (tied to courses).
- **`clo_plo_mapping`**: Maps which CLOs satisfy which PLOs.
- **`syllabi`**: Text/JSON overviews, learning objectives, and weekly schedules tied to a course.

## Assessment & Grading
- **`assessments`**: Created by faculty for a specific `course_assignment`. Can be Quizzes, Assignments, Midterms, or Finals. Have total marks and weightages.
- **`assessment_questions`**: Granular breakdown of an assessment. Each question has max marks and maps to specific `clos`.
- **`grades`**: Records the marks a `student` achieved on a specific `assessment`.

## Attendance
- **`attendance`**: Records whether a student was present, absent, or late for a specific `course_assignment` on a specific `date`.

## Utility Tables
- **`notifications`**: System alerts tied to a `user_id`.
- **`schema_migrations`**: Tracks which `.sql` files have been executed.
- **`password_resets` & `faculty_invites`**: Security tokens for auth workflows.

## Naming Conventions & Rules
- All tables use `snake_case`.
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` extensively.
- Junction tables are named `[entity1]_[entity2]_mapping` or `[entity1]_[entity2]s`.
