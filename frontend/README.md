# FYP-LMS - Frontend

Learning Management System - Frontend Application

## Tech Stack

- **React** 19.2.0
- **Vite** 7.2.4
- **React Router DOM** 7.10.1
- **Axios** 1.13.2

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` file with your configuration

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

Detailed explanation of each folder and subfolder:

```
src/
├── assets/          # Static assets folder
├── components/      # React components folder
│   ├── common/      # Common/reusable components subfolder
│   └── layout/      # Layout components subfolder
├── constants/       # Application constants folder
├── context/         # React Context providers folder
├── hooks/           # Custom React hooks folder
├── pages/           # Page components folder
├── services/        # API services folder
├── utils/           # Utility functions folder
├── App.jsx          # Main App component
├── App.css          # App component styles
├── main.jsx         # Application entry point
└── index.css        # Global styles
```

### 📁 Folder Details

#### **`assets/`** - Static Assets
Contains all static files that don't need processing:
- **Images**: `.jpg`, `.png`, `.svg`, `.gif` files
- **Icons**: Icon files, favicon, logo files
- **Fonts**: Custom font files (if any)
- **Other media**: Videos, audio files (if needed)

**Example files:**
- `logo.svg`, `hero-image.png`, `favicon.ico`

---

#### **`components/`** - React Components
Main folder for all React components. Components are organized into subfolders based on their purpose.

**`components/common/`** - Reusable UI Components
Contains reusable, generic components used throughout the application:
- **Button components**: Custom button variants (PrimaryButton, SecondaryButton)
- **Input components**: TextInput, TextArea, Select, Checkbox, Radio
- **Card components**: Card, CardHeader, CardBody
- **Modal components**: Modal, Dialog, ConfirmDialog
- **Loading components**: Spinner, Skeleton, LoadingBar
- **Form components**: FormGroup, FormLabel, FormError
- **Navigation components**: Navbar, Breadcrumb, Pagination
- **Display components**: Badge, Avatar, Tooltip, Dropdown

**Example files:**
- `Button.jsx`, `Input.jsx`, `Card.jsx`, `Modal.jsx`, `Loading.jsx`

**`components/layout/`** - Layout Components
Contains layout wrapper components that provide structure to pages:
- **MainLayout**: Default layout with header, sidebar, footer
- **AuthLayout**: Layout for authentication pages (login, register) - usually centered, no sidebar
- **DashboardLayout**: Layout for dashboard pages with sidebar navigation
- **EmptyLayout**: Minimal layout for specific pages that need no header/footer
- **Header/Footer**: Reusable header and footer components
- **Sidebar**: Navigation sidebar component

**Example files:**
- `MainLayout.jsx`, `AuthLayout.jsx`, `DashboardLayout.jsx`, `Header.jsx`, `Footer.jsx`, `Sidebar.jsx`

---

#### **`pages/`** - Page Components
Contains top-level page components that correspond to routes in your application:
- Each file represents a route/page in your app
- These are the main screens users see when navigating
- Pages can use layouts and common components
- Usually named after the route (e.g., `Home.jsx`, `Login.jsx`, `Dashboard.jsx`)

**Example files:**
- `Home.jsx` - Home page component
- `Login.jsx` - Login page component
- `Register.jsx` - Registration page component
- `Dashboard.jsx` - Dashboard page component
- `Profile.jsx` - User profile page
- `Courses.jsx` - Courses listing page
- `CourseDetail.jsx` - Individual course detail page

**Note:** Pages are connected to routes in `App.jsx` using React Router.

---

#### **`services/`** - API Services
Contains all API-related code for communicating with the backend:
- **API client setup**: Axios instance configuration (`api.js`)
- **Service modules**: Organized by domain/feature
  - Authentication services: `authService.js` (login, register, logout)
  - Course services: `courseService.js` (get courses, enroll, etc.)
  - User services: `userService.js` (get profile, update profile)
  - Admin services: `adminService.js` (if needed)

**Example files:**
- `api.js` - Main axios instance with interceptors
- `authService.js` - Authentication API calls
- `courseService.js` - Course-related API calls
- `userService.js` - User-related API calls

**Structure example:**
```javascript
// services/api.js - Axios instance
// services/authService.js - export { login, register, logout }
// services/courseService.js - export { getCourses, getCourse, enrollCourse }
```

---

#### **`context/`** - React Context Providers
Contains React Context providers for global state management:
- **AuthContext**: User authentication state (logged in user, token)
- **ThemeContext**: Theme preferences (dark/light mode)
- **NotificationContext**: Global notifications/toasts
- **CourseContext**: Course-related global state (if needed)
- **AppContext**: General app-wide state

**Example files:**
- `AuthContext.jsx` - Authentication state provider
- `ThemeContext.jsx` - Theme state provider
- `NotificationContext.jsx` - Notification/alert provider

**Usage:** These are typically wrapped around the app in `main.jsx` or `App.jsx`.

---

#### **`hooks/`** - Custom React Hooks
Contains reusable custom React hooks:
- **useAuth**: Hook to access authentication context
- **useLocalStorage**: Hook to sync state with localStorage
- **useDebounce**: Hook for debouncing values
- **useApi**: Hook for API calls with loading/error states
- **useForm**: Hook for form management
- **useMediaQuery**: Hook for responsive design checks

**Example files:**
- `useAuth.js` - Authentication hook
- `useLocalStorage.js` - LocalStorage hook
- `useDebounce.js` - Debounce hook
- `useApi.js` - API call hook with loading states

**Naming convention:** All custom hooks should start with `use` prefix.

---

#### **`utils/`** - Utility Functions
Contains helper functions and utilities used across the application:
- **Formatters**: Date formatting, currency formatting, text formatting
- **Validators**: Form validation functions, email validation, password validation
- **Helpers**: General helper functions (truncate text, capitalize, debounce)
- **Constants helpers**: Route generators, API endpoint builders
- **Error handlers**: Error message extractors, error formatters

**Example files:**
- `helpers.js` - General helper functions
- `validators.js` - Validation functions
- `formatters.js` - Data formatting functions (dates, numbers, text)
- `errorHandler.js` - Error handling utilities

**Example functions:**
```javascript
// utils/helpers.js
- formatDate(date)
- truncateText(text, maxLength)
- capitalize(str)

// utils/validators.js
- validateEmail(email)
- validatePassword(password)
- validateRequired(value)
```

---

#### **`constants/`** - Application Constants
Contains constant values used throughout the application:
- **Routes**: Route path constants (avoid hardcoding strings)
- **API endpoints**: API endpoint URLs
- **Config**: Application configuration values
- **Messages**: Success/error messages
- **Validation rules**: Regex patterns, validation limits

**Example files:**
- `routes.js` - Route path constants
- `apiEndpoints.js` - API endpoint URLs
- `config.js` - App configuration
- `messages.js` - Success/error message constants

**Example structure:**
```javascript
// constants/routes.js
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard'
};

// constants/config.js
export const APP_CONFIG = {
  MAX_FILE_SIZE: 5242880, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png']
};
```

---

#### **Root Level Files**

**`main.jsx`** - Application Entry Point
- Initializes React application
- Renders the root App component
- Sets up React Router BrowserRouter
- Wraps app with Context providers
- Mounts app to DOM element (`#root`)

**`App.jsx`** - Main App Component
- Defines application routes using React Router
- Sets up route configuration
- Can contain global app-level logic
- Main routing logic lives here

**`App.css`** - App Component Styles
- Styles specific to App component
- Global app-level styles (if not using CSS modules)

**`index.css`** - Global Styles
- Global CSS reset
- CSS variables (colors, fonts, spacing)
- Base typography styles
- Utility classes
- Global animations

---

### 📋 File Organization Best Practices

1. **Components**: One component per file, named with PascalCase (e.g., `Button.jsx`)
2. **Hooks**: One hook per file, named with camelCase starting with `use` (e.g., `useAuth.js`)
3. **Utils**: Group related functions in one file (e.g., all date functions in `dateUtils.js`)
4. **Services**: One service file per domain/feature (e.g., `authService.js`, `courseService.js`)
5. **Constants**: Group related constants together (e.g., all routes in `routes.js`)
6. **Pages**: One page component per file, match the route name

---

### 🔄 Typical File Flow

1. **User navigates** → Route in `App.jsx` → Renders a **Page** component
2. **Page component** → Uses **Layout** component → Renders **Common** components
3. **Page/Component** → Uses **Custom Hooks** → Calls **Services**
4. **Services** → Makes API calls → Returns data
5. **Context** → Provides global state → Used by multiple components
6. **Utils** → Helper functions → Used everywhere as needed
7. **Constants** → Fixed values → Imported where needed

## Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

- `VITE_API_BASE_URL` - Backend API base URL

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

[Your License Here]
