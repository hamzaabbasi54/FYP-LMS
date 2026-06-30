# FYP LMS — Student Mobile App

Flutter student app. **Sirf API se data fetch karti hai** — UI ready hai, backend aap khud connect karenge.

## Abhi kya chal raha hai

- **Mock mode ON** — bina API ke demo data se app chalti hai
- Login, dashboard, courses, assignments, schedule, profile — sab UI ready

## API connect kaise karein

### 1. `lib/core/config/app_config.dart` mein URL lagayein

```dart
static const bool useMockData = false;
static const String apiBaseUrl = 'https://your-api.com/api';
```

Ya run karte waqt:

```bash
flutter run \
  --dart-define=USE_MOCK=false \
  --dart-define=API_BASE_URL=https://your-api.com/api
```

### 2. API response format

Har response ideally aise ho:

```json
{
  "success": true,
  "data": { ... }
}
```

Login response:

```json
{
  "success": true,
  "data": {
    "token": "jwt...",
    "user": { "id", "name", "email", "registration_number", "department", "semester", "program" }
  }
}
```

Auth header: `Authorization: Bearer <token>`

### 3. Endpoints jo app call karti hai

| Screen | Method | Path |
|--------|--------|------|
| Login | POST | `/student-auth/login` |
| Session | GET | `/student-auth/me` |
| Change password | PUT | `/student-auth/change-password` |
| Profile | GET | `/student-portal/profile` |
| Courses | GET | `/student-portal/courses` |
| Course attendance | GET | `/student-portal/courses/:id/attendance` |
| Course grades | GET | `/student-portal/courses/:id/grades` |
| Schedule | GET | `/student-portal/schedule` |
| Assignments | GET | `/student-portal/assignments` (read-only, no upload) |
| Announcements | GET | `/student-portal/announcements` |

**Backend team ke liye:** `docs/API_FOR_BACKEND_TEAM.md` — poori detail + database mapping

Assignments **view-only** hain — student upload nahi karta, sirf teacher ke diye marks dekhta hai.

Field names / models: `lib/core/models/`

## Demo login (mock mode)

| Email | Password |
|-------|----------|
| `student@university.edu` | `password123` |

## Run

```bash
flutter pub get
flutter run
```

## Project structure

```
lib/
├── core/api/       # Dio client, endpoints
├── core/models/    # JSON → Dart models
├── features/       # screens + repositories (API calls yahan)
├── mock/           # demo data
└── shared/         # UI widgets
```
