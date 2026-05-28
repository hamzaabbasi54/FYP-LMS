# FYP-LMS: Folder Structure Overview

This project is a monorepo containing both the backend Node.js server and the frontend React application.

## Root Directory (`d:\FYP\FYP-LMS`)
- `/backend`: Node.js Express API.
- `/frontend`: Vite React Application.
- Various `.md` documentation files for context.

---

## Backend Structure (`/backend`)
- **`/config`**: Configuration files (e.g., `db.js` for MySQL connection pool).
- **`/controllers`** *(optional)*: Some logic may be placed here, though currently much is handled directly in routes.
- **`/middleware`**: Express middlewares (e.g., `auth.js` for JWT verification and role-checking, error handlers).
- **`/migrations`**: SQL files containing database schema definitions and updates (e.g., `001_initial_schema.sql`). Ran via `node migrate.js`.
- **`/routes`**: Contains all Express router definitions, separated by domain (e.g., `adminRoutes.js`, `courseRoutes.js`, `batchRoutes.js`, `auth.js`).
- **`/utils`**: Helper functions (e.g., `excel.js` for parsing uploads, `pagination.js`, email utilities).
- **`/uploads`**: Temporary storage for uploaded files (Excel/CSV imports).
- **`server.js`**: The main entry point for the backend server.
- **`migrate.js`**: Custom script to run unapplied SQL migrations sequentially.

---

## Frontend Structure (`/frontend`)
- **`/public`**: Static assets (images, fonts, raw SVGs).
- **`/src`**: Main source code directory.
  - **`/components`**: Reusable UI components (buttons, modals, layouts, sidebars).
    - `/layouts`: Shared wrappers like `AdminLayout`, `FacultyLayout`.
  - **`/pages`**: Full page views, typically separated by user role.
    - `/admin-pages`: Screens exclusively for `deptadmin` (e.g., `Dashboard.jsx`, `BatchDetails.jsx`, `CourseCatalog.jsx`).
    - `/faculty-pages`: Screens exclusively for `faculty` (e.g., `FacultyDashboard.jsx`, `Schedule.jsx`, grading/attendance pages).
    - `/student-pages`: Screens for students.
    - `/public-pages`: Unauthenticated pages (e.g., `Login.jsx`, reset password).
  - **`/services`**: API interaction layers.
    - `api.js`: Axios instance configuration and exported service objects (e.g., `authApi`, `batchApi`, `courseApi`) encapsulating backend endpoints.
  - **`/utils`**: Helper functions (date formatting, validators).
  - **`/context`** *(if applicable)*: React Context providers for global state (e.g., AuthContext).
  - **`App.jsx`**: Main routing configuration using React Router DOM. Maps paths to components and enforces route protection.
  - **`index.css`**: Global Tailwind CSS imports and custom utility classes.
  - **`main.jsx`**: React rendering entry point.
