# FYP-LMS: AI Context Guide

This document serves as the master index for the AI agent to quickly understand the structure, architecture, and database of the FYP-LMS project without needing to read the entire codebase. 

Whenever you lose context of the system, refer to the documents linked below:

## 1. System Architecture
Read [SYSTEM_ARCHITECTURE.md](file:///d:/FYP/FYP-LMS/SYSTEM_ARCHITECTURE.md) to understand the high-level design, technology stack (React + Node/Express + MySQL), and core concepts like Outcome-Based Education (OBE) integration and the academic hierarchy.

## 2. Database Schema
Read [DATABASE_SCHEMA.md](file:///d:/FYP/FYP-LMS/DATABASE_SCHEMA.md) for a summary of the database tables, their relationships, and the custom raw SQL migration strategy used in the project.

## 3. API Documentation
Read [API_DOCUMENTATION.md](file:///d:/FYP/FYP-LMS/API_DOCUMENTATION.md) to understand how the backend routes are structured, where the route mount points are defined, how authentication middleware works, and how the frontend consumes these APIs.

## 4. Folder Structure
Read [FOLDER_STRUCTURE.md](file:///d:/FYP/FYP-LMS/FOLDER_STRUCTURE.md) for a detailed breakdown of both the `backend/` and `frontend/` directories, including where to find React pages, API services, and backend controllers/routes.

## 5. Bug Tracker (MUST READ before fixing bugs)
Read [BUG_TRACKER.md](file:///d:/FYP/FYP-LMS/md%20files/BUG_TRACKER.md) for the current status of all known bugs, their root causes, affected files, and solutions. This file is updated as bugs are found and fixed. **Start here when resuming after context loss.**

## 6. Lessons Learned (MUST READ before writing code)
Read [LESSONS_LEARNED.md](file:///d:/FYP/FYP-LMS/md%20files/LESSONS_LEARNED.md) for a catalog of past mistakes and how to avoid them. Covers URL mismatches, data shape issues, duplicate routes, SQL parameterization, import hygiene, and copy-on-write patterns.

---

### Core Rules for AI Agent:
1. **Migrations**: NEVER alter existing SQL migration files. If a database schema change is required, ALWAYS create a new sequentially numbered `.sql` file in `backend/migrations/` and run `node migrate.js` from the `backend/` directory.
2. **Database Queries**: The backend uses `mysql2` raw queries (`pool.query`). There is no ORM like Sequelize or Prisma.
3. **Frontend API Calls**: Always use the defined services in `frontend/src/services/api.js`. If you create a new backend endpoint, define the corresponding method in this file.
4. **Styling**: The frontend uses standard Tailwind CSS. Do not use generic component libraries like Material-UI unless specifically requested; prefer building custom UI components with Tailwind and `react-icons/md`.
