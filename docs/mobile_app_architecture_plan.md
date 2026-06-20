# Student Mobile App — Architecture & Implementation Plan

This document outlines the recommended architecture, technology stack, and implementation strategy for the FYP-LMS Student Mobile App. It is designed to guide the mobile app team in building a robust application that communicates seamlessly with our read-only student API.

---

## 1. Recommended Technology Stack

Since the university's web admin panel is built with React, we highly recommend using **React Native (with Expo)** for the mobile app. This allows for code/logic sharing, uses the same JavaScript/TypeScript ecosystem, and compiles to both iOS and Android natively.

| Category | Technology | Why? |
| :--- | :--- | :--- |
| **Framework** | **React Native (Expo)** | Cross-platform, fast prototyping, easy deployment, familiar to React web developers. |
| **Routing** | **Expo Router** | File-based routing (similar to Next.js), deep linking support out of the box. |
| **State Management**| **Zustand** | Lightweight, boilerplate-free alternative to Redux. Perfect for managing user sessions and UI state. |
| **Data Fetching** | **Axios + React Query** | `Axios` for token interceptors; `React Query` (TanStack Query) for caching, loading states, and pull-to-refresh logic. |
| **Secure Storage** | **expo-secure-store** | Safely stores the JWT authentication token using the OS's native keychain (encrypted). |
| **Styling** | **NativeWind (Tailwind)**| Allows you to use Tailwind CSS utility classes in React Native, maintaining design consistency with the web app. |

---

## 2. High-Level Architecture

The app should follow a modular, feature-based architecture (often called a "slice" architecture). This keeps API logic, state, and UI grouped by feature rather than scattering them across global folders.

```mermaid
graph TD
    UI[UI Components / Screens] --> Hooks[Custom Hooks (React Query)]
    Hooks --> API[API Client / Axios]
    API --> Backend[(FYP-LMS Backend API)]
    
    Hooks --> Store[Local State / Zustand]
    API --> Interceptors[Axios Interceptors]
    Interceptors --> SecureStore[(Secure Keychain - JWT)]
```

---

## 3. Recommended Folder Structure

Using an Expo Router setup, your project should be structured like this:

```text
fyp-student-app/
├── app/                      # EXPO ROUTER - Maps directly to app screens
│   ├── (auth)/               # Auth group (Login, Forgot Password)
│   │   ├── login.tsx         
│   ├── (tabs)/               # Main bottom-tab navigation group
│   │   ├── _layout.tsx       # Bottom tab bar configuration
│   │   ├── index.tsx         # Dashboard / Home
│   │   ├── courses.tsx       # Enrolled Courses List
│   │   ├── schedule.tsx      # Weekly Timetable
│   │   └── profile.tsx       # Student Profile & Settings
│   ├── courses/              # Nested screens
│   │   └── [id].tsx          # Course details (Attendance & Grades tabs)
│   └── _layout.tsx           # Root layout (handles Auth checking)
│
├── src/                      # APP CORE LOGIC
│   ├── api/                  # API Configuration
│   │   ├── axios.ts          # Axios instance + Interceptors (adds Bearer token)
│   │   └── endpoints.ts      # URL constants
│   │
│   ├── features/             # FEATURE MODULES (The core of the app)
│   │   ├── auth/             # Auth logic
│   │   │   ├── authApi.ts    # login(), logout() API calls
│   │   │   └── authStore.ts  # Zustand store (holds user info & token state)
│   │   ├── courses/          # Courses & Grades logic
│   │   ├── attendance/       # Attendance logic
│   │   └── schedule/         # Schedule logic
│   │
│   ├── components/           # SHARED UI COMPONENTS
│   │   ├── ui/               # Buttons, Cards, Inputs, Loaders
│   │   └── layout/           # Headers, Screen wrappers
│   │
│   ├── theme/                # Global styles, colors, typography
│   └── utils/                # Helpers (date formatting, secure storage wrappers)
```

---

## 4. API Communication Strategy

Communicating with the backend requires handling the JWT Bearer token securely. 

### 4.1. The Axios Interceptor Setup
You must create a centralized Axios instance. Every request sent through this instance will automatically retrieve the JWT from Secure Storage and attach it to the headers.

**Example `src/api/axios.ts`:**
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiClient = axios.create({
  baseURL: 'https://api.your-university.edu/api',
  timeout: 10000,
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('student_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid, expired, or token_version changed
      await SecureStore.deleteItemAsync('student_jwt');
      // Trigger a global state update to kick the user back to the Login screen
      useAuthStore.getState().logout(); 
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 4.2. Data Fetching with React Query
Instead of using standard `useEffect` to fetch data, use React Query. It handles caching, loading states, and pull-to-refresh effortlessly.

**Example Fetching the Schedule:**
```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';

const fetchSchedule = async () => {
  const { data } = await apiClient.get('/student-portal/schedule');
  return data.data; // Assuming backend returns { success: true, data: [...] }
};

export const useSchedule = () => {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
  });
};
```

---

## 5. Security Best Practices for the Mobile Team

> [!CAUTION]
> **Never store the JWT in `AsyncStorage` (React Native's default storage).**
> `AsyncStorage` saves data in plain text. Always use `expo-secure-store` (or `react-native-keychain` if not using Expo) to encrypt the token on the device.

> [!WARNING]
> **Handle 401 Errors Gracefully.**
> The backend implements a `token_version` system. If an admin disables a student's account or changes their password, their active JWT becomes immediately invalid. The app must catch `401` errors globally (via the Axios interceptor) and force the user back to the login screen.

> [!NOTE]
> **Offline Support (Optional).**
> Because LMS data (like past attendance and grades) doesn't change every second, consider using React Query's built-in offline caching so students can view their schedules even when they don't have internet access on campus.

---

## 6. Implementation Milestones

1.  **Phase 1: Foundation (Week 1)**
    *   Initialize Expo Router project.
    *   Set up Zustand store and secure storage for JWTs.
    *   Build Login screen and hook up to `/api/student-auth/login`.
    *   Implement Axios interceptors for Bearer tokens and 401 handling.
2.  **Phase 2: Core Dashboard (Week 2)**
    *   Build Bottom Tab Navigation.
    *   Fetch and display student `/profile` on the Dashboard.
    *   Implement `/schedule` view (Weekly timetable UI).
3.  **Phase 3: Academics (Week 3)**
    *   Fetch list of `/courses`.
    *   Create Course Details screen with two tabs: Attendance and Grades.
    *   Implement pull-to-refresh on all lists.
4.  **Phase 4: Polish (Week 4)**
    *   Add "Change Password" functionality in Profile settings.
    *   Implement empty states (e.g., "No classes scheduled today").
    *   Finalize styling to match university branding.
