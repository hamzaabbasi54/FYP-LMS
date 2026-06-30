# Campus Flow Student App — Poori Guide (Roman Urdu)

> Yeh guide sirf **mobile app** (`fyp_student_app`) ke liye hai — web portal alag hai.
> App Flutter mein bani hai aur data **backend API** se leti hai (direct MySQL nahi).

---

## 1. App kya karti hai?

Yeh **Flutter** ki mobile app hai jo **student** ke liye banai gayi hai:

- Login karta hai
- Courses, attendance, grades, schedule dekhta hai
- Teacher announcements dekhta hai
- Profile aur password change karta hai

Sab data **backend API** se aata hai (MySQL database ke through). App khud database se connect nahi karti — sirf HTTP requests bhejti hai.

---

## 2. Folder structure (`lib/`)

```
lib/
├── main.dart              → App start hoti hai yahan se
├── app.dart               → Root widget, theme, router
├── core/                  → Shared logic (API, colors, models)
│   ├── api/               → HTTP client, endpoints
│   ├── config/            → App settings (API URL, etc.)
│   ├── models/            → Data classes (Course, User, etc.)
│   ├── providers/         → Shared refresh logic
│   ├── storage/           → Token save (secure)
│   ├── theme/             → Colors, fonts
│   └── router/            → Navigation routes
├── features/              → Har screen ka apna folder
│   ├── auth/              → Login, logout
│   ├── dashboard/         → Home screen
│   ├── courses/           → Courses list + detail
│   ├── grades/            → All subjects marks
│   ├── schedule/          → Weekly timetable
│   ├── profile/           → Profile + change password
│   ├── updates/           → Announcements data
│   └── assignments/       → Assignments (legacy screens)
├── shared/widgets/        → Reuse hone wale UI parts
└── mock/                  → Fake data (jab API band ho)
```

**Soch lo aise:**
- `core` = engine (petrol, wiring)
- `features` = kamre (login room, dashboard room)
- `shared` = common furniture (buttons, cards)

---

## 3. App kaise start hoti hai?

### `main.dart`

```dart
runApp(ProviderScope(child: FypStudentApp()))
```

- **ProviderScope** = Riverpod ka wrapper — poori app ko "state manager" deta hai
- **FypStudentApp** = asli app widget

### `app.dart`

1. App khulte hi `checkAuthStatus()` chalta hai — kya pehle se login hai?
2. **SessionManager** set hota hai — agar token expire ho to auto logout
3. **MaterialApp.router** + **GoRouter** = screens ke beech navigation

**Flow:**

```
App khuli → Token check → Login hai? → Home
                        → Nahi?     → Login screen
```

---

## 4. Navigation — `core/router/app_router.dart`

**GoRouter** URLs jaisa kaam karta hai:

| URL | Screen |
|-----|--------|
| `/login` | Login |
| `/` | Home (Dashboard) |
| `/courses` | Courses list |
| `/grades` | Grades |
| `/schedule` | Schedule |
| `/profile` | Profile |
| `/courses/:id` | Course detail |
| `/change-password` | Password change |

**Redirect logic:**
- Login nahi + koi aur page → `/login` par bhej do
- Login hai + `/login` par ho → `/` par bhej do

**ShellRoute:** Bottom 5 tabs ek hi shell (`MainShell`) mein hain — swipe bhi kar sakte ho.

---

## 5. State management — Riverpod kya hai?

**Riverpod** = app ka "memory" jahan data rakha jata hai.

**Types jo app mein use hote hain:**

| Type | Example | Matlab |
|------|---------|--------|
| `Provider` | `apiClientProvider` | Ek cheez banao, sab use karein |
| `StateNotifierProvider` | `authProvider` | Login state change hoti rehti hai |
| `FutureProvider` | `coursesProvider` | API se data load, auto cache |

**Screen par data kaise milta hai:**

```dart
final coursesAsync = ref.watch(coursesProvider);
```

- `watch` = jab data change ho, screen dubara ban jaye
- `read` = ek dafa use karo (button press par)

---

## 6. Configuration — `core/config/app_config.dart`

| Setting | Kaam |
|---------|------|
| `appName` | "Campus Flow" |
| `apiBaseUrl` | Server address, e.g. `http://10.141.27.78:3000/api` |
| `useMockData` | `true` = fake data, `false` = real API |
| `jwtStorageKey` | Token phone mein kis naam se save ho |

**Build time par change:**

```bash
flutter run --dart-define=USE_MOCK=false --dart-define=API_BASE_URL=http://IP:3000/api
```

---

## 7. API layer — server se baat

### `core/api/endpoints.dart`

Sirf URLs ki list — backend ke paths:

| Endpoint | Kaam |
|----------|------|
| `POST /student-auth/login` | Login |
| `POST /student-auth/logout` | Logout |
| `GET /student-auth/me` | Current user check |
| `PUT /student-auth/change-password` | Password change |
| `GET /student-portal/profile` | Student profile |
| `GET /student-portal/courses` | Enrolled courses |
| `GET /student-portal/courses/:id/attendance` | Course attendance |
| `GET /student-portal/courses/:id/grades` | Course grades |
| `GET /student-portal/grades` | All subjects grades |
| `GET /student-portal/schedule` | Timetable |
| `GET /student-portal/announcements` | Teacher updates |

### `core/api/api_client.dart` (Dio)

**Dio** = HTTP client (Postman jaisa, code mein).

**Har request par:**
1. Phone se **JWT token** header mein lagta hai: `Authorization: Bearer xyz...`
2. **Session epoch** track hota hai — purani requests ignore

**401 error (unauthorized) par:**
- Ek dafa retry (login ke turant baad race condition fix)
- Phir bhi fail → token delete → logout

### `core/api/api_response.dart`

Backend `{ success: true, data: [...] }` bhejta hai — yeh helper `data` nikalta hai.

---

## 8. Secure storage — token kahan save?

### `core/storage/secure_storage_service.dart`

- Login ke baad **JWT token** phone ki encrypted memory mein save
- `_memoryToken` = turant use ke liye (Android slow storage fix)
- Logout par delete

### `core/storage/session_manager.dart`

- `epoch` = har login/logout par number badhta hai
- Purane 401 errors naye session ko logout nahi karte

---

## 9. Authentication — poora flow

### Files:

| File | Kaam |
|------|------|
| `features/auth/data/auth_repository.dart` | API calls (login, logout, me, change password) |
| `features/auth/providers/auth_provider.dart` | UI state (logged in / out) |
| `features/auth/screens/login_screen.dart` | Login form UI |

### Login flow:

```
User email/password likhe
    ↓
authProvider.login()
    ↓
authRepository → POST /student-auth/login
    ↓
Token save (SecureStorage)
    ↓
refreshPortalData() — sab providers refresh
    ↓
Router → Home (/)
```

**Test login (agar DB mein account hai):**
- Email: student email (e.g. `ali.khan1@gmail.com`)
- Password: email ke last digits (e.g. `1`)

### Logout flow:

```
authProvider.logout()
    ↓
State = unauthenticated (pehle)
    ↓
POST /logout + token delete
```

### Session restore (app dubara khule):

```
checkAuthStatus()
    ↓
Token hai? → GET /student-auth/me
    ↓
User mila → logged in
    ↓
Nahi → login screen
```

### Change password:

- `PUT /student-auth/change-password`
- Naya token milta hai → save → logout nahi hota

---

## 10. Data refresh — `core/providers/portal_refresh.dart`

Login ke baad purana cached data hatane ke liye:

```dart
invalidate(profileProvider);
invalidate(coursesProvider);
invalidate(scheduleProvider);
invalidate(teacherUpdatesProvider);
invalidate(gradesProvider);
```

Matlab: har provider dubara API call karega.

**Bottom nav tabs (swipe order):**

```dart
const portalTabPaths = ['/', '/courses', '/grades', '/schedule', '/profile'];
```

---

## 11. Models — JSON ko Dart objects

API JSON bhejti hai, app **models** mein convert karti hai.

### `core/models/user_model.dart` — `StudentProfile`

| Field | Matlab |
|-------|--------|
| `name` | Student ka naam |
| `email` | Email |
| `semester` | Semester / batch |
| `department` | Department |
| `program` | Program name |
| `cgpa` | CGPA (API se) |
| `registrationNumber` | Roll / student ID |

`fromJson()` — server ke alag field names handle karta hai.

### `core/models/course_model.dart` — `Course`

| Field | Matlab |
|-------|--------|
| `id` | course_assignment_id |
| `code` | IT-101, MATH-102, etc. |
| `name` | Course title |
| `instructor` | Teacher naam |
| `attendancePercentage` | % attendance |
| `totalClasses` | Total classes |
| `presentClasses` | Present count |
| `currentGrade` | Letter grade |

`CourseDetail` = course + attendance records + grade records

### `core/models/schedule_model.dart` — `ScheduleSlot`

- `dayOfWeek` (1=Monday ... 7=Sunday)
- `startTime`, `endTime`
- `room`, `courseName`, `courseCode`

### `core/models/student_grade_model.dart`

Grades tab ke liye — subject wise quiz, assignment, midterm, final marks.

### `core/models/assignment_model.dart` — `TeacherUpdate`

Announcements / notifications ke liye.

---

## 12. Repositories — har feature ka data layer

**Pattern har jagah same:**

```
Screen → ref.watch(xxxProvider)
              ↓
         Repository → Dio → API
              ↓
         Model.fromJson()
              ↓
         UI par dikhao
```

| File | API | Provider |
|------|-----|----------|
| `features/profile/data/profile_repository.dart` | `/profile` | `profileProvider` |
| `features/courses/data/courses_repository.dart` | `/courses` | `coursesProvider` |
| `features/grades/data/grades_repository.dart` | `/grades` | `gradesProvider` |
| `features/schedule/data/schedule_repository.dart` | `/schedule` | `scheduleProvider` |
| `features/updates/data/updates_repository.dart` | `/announcements` | `teacherUpdatesProvider` |

**Mock mode:** `AppConfig.useMockData == true` ho to `mock/mock_data.dart` se fake data.

---

## 13. Main Shell — 5 tabs

### `shared/widgets/main_shell.dart`

**Structure:**

```
┌─────────────────────────┐
│  CampusFlowBrandBar     │  ← Logo + notifications
├─────────────────────────┤
│                         │
│  PageView (swipe)       │  ← 5 screens
│                         │
├─────────────────────────┤
│  Bottom Nav (5 tabs)    │
└─────────────────────────┘
```

- **PageController** — swipe left/right se tab change
- **GoRouter** — URL bhi update (`/courses`, `/grades`, ...)
- **_KeepAliveTab** — tab switch par screen destroy nahi hoti (fast wapas aana)

**Tabs:** Home → Courses → Grades → Schedule → Profile

---

## 14. Har screen ka kaam (detail)

### A) Login — `features/auth/screens/login_screen.dart`

- Email + password form
- `CampusFlowLogo` — real logo image (`assets/images/campus_flow_logo.png`)
- Login button → `authProvider.login()`
- Error → red SnackBar

### B) Dashboard — `features/dashboard/screens/dashboard_screen.dart` (Home)

**Sab providers se data:**

| Provider | Kya dikhata hai |
|----------|-----------------|
| `profileProvider` | Naam, CGPA, semester, program |
| `coursesProvider` | Courses count, attendance list |
| `scheduleProvider` | Next class + countdown |
| `teacherUpdatesProvider` | Announcements |

**UI Sections:**

1. **Hero card** — greeting, naam, avatar, stats (CGPA, avg attendance, courses)
2. **Next class card** — schedule se agli class calculate + "in 1h 16m" countdown
3. **Quick access** — Courses / Grades / Schedule / Results buttons
4. **Subject attendance** — har subject ka ring % + present/total classes
5. **Important updates** — teacher announcements (urgent/normal style)

**Pull down** = RefreshIndicator → `refreshPortalData()`

### C) Courses — `features/courses/screens/courses_screen.dart`

- Enrolled courses ki list
- Har card par: code, name, instructor, attendance %
- Tap → `/courses/:id` (detail screen)

### D) Course Detail — `features/courses/screens/course_detail_screen.dart`

- `courseDetailProvider(id)` se data:
  - **Attendance tab** — har class present/absent/late
  - **Grades tab** — quiz, assignment, mid, final marks
- Do APIs parallel call hoti hain: attendance + grades

### E) Grades — `features/grades/screens/grades_screen.dart`

- `gradesProvider` → **sab subjects** ke marks ek jagah
- Teacher web portal se jo grades publish hain woh yahan dikhte hain
- Har subject expand karke dekh sakte ho

### F) Schedule — `features/schedule/screens/schedule_screen.dart`

- Hafte ke din select karo (Mon–Sun chips)
- Us din ki classes — time, room, subject
- Sirf **enrolled** courses ki classes (poora batch nahi)

### G) Profile — `features/profile/screens/profile_screen.dart`

- Student info (name, email, roll, department)
- **Change password** button → `/change-password`
- **Logout** button

### H) Change Password — `features/profile/screens/change_password_screen.dart`

- Purana + naya password fields
- `authRepository.changePassword()`
- Success par naya JWT token save hota hai

---

## 15. Shared widgets — reuse UI

| Widget | File | Kaam |
|--------|------|------|
| Campus Flow Logo | `campus_flow_logo.dart` | Logo image asset |
| Brand Bar | `campus_flow_brand_bar.dart` | Top bar: logo + title + bell |
| Notification Button | `notification_button.dart` | Announcements bottom sheet |
| Attendance Tile | `attendance_progress_tile.dart` | Ring + % + subject row |
| Main Shell | `main_shell.dart` | Bottom nav + PageView |
| App Card | `app_card.dart` | White rounded card |
| App Button | `app_button.dart` | Styled buttons |
| App Text Field | `app_text_field.dart` | Input fields |
| Loading View | `loading_view.dart` | Spinner + message |
| Section Header | `section_header.dart` | Section title + "See all" |
| Stat Card | `stat_card.dart` | Small stat box |
| Status Chip | `status_chip.dart` | Colored status badge |

---

## 16. Theme — colors & fonts

### `core/theme/app_colors.dart`

| Color | Hex | Use |
|-------|-----|-----|
| `primary` | `#0078C5` | Logo blue — buttons, links, hero |
| `background` | `#EFF8FF` | Screen background |
| `surface` | `#FFFFFF` | Cards |
| `error` | `#E03131` | Red — low attendance, errors |
| `success` | `#2F9E44` | Green — good attendance |
| `warning` | `#F59F00` | Yellow — medium attendance |

`attendanceColor(pct)` — 75% se kam = red, 85%+ = green

### `core/theme/app_theme.dart`

- Font: **Plus Jakarta Sans** (poori app)
- Buttons, inputs, cards ki default Material styling

---

## 17. Poora data flow

```
┌──────────────┐     HTTP      ┌──────────────┐     SQL     ┌──────────┐
│  Flutter App │ ◄──────────► │ Node Backend │ ◄──────────► │  MySQL   │
│  (Phone)     │   JWT Token  │  port 3000   │             │ Database │
└──────────────┘              └──────────────┘             └──────────┘

Phone par:
  UI Screen
      ↓ ref.watch
  FutureProvider / StateNotifier
      ↓
  Repository
      ↓ Dio (api_client)
  API Endpoint
      ↓ JSON
  Model.fromJson()
      ↓
  UI par dikhao
```

---

## 18. Important packages

| Package | Kaam |
|---------|------|
| `flutter_riverpod` | State management |
| `go_router` | Navigation / routes |
| `dio` | HTTP requests |
| `flutter_secure_storage` | Token safe save |
| `google_fonts` | Fonts download |
| `intl` | Dates format (Jun 30, etc.) |

---

## 19. Android side (short)

| File | Kaam |
|------|------|
| `android/app/build.gradle` | Package: `com.campusflow.student`, signing |
| `AndroidManifest.xml` | App name "Campus Flow", internet permission |
| `network_security_config.xml` | HTTP allow (development) |
| `release/` folder | Play Store AAB + APK files |

**Release build:**

```bash
./scripts/build_playstore.sh https://apna-server.com/api
```

Guide: `PLAYSTORE_RELEASE.md`

---

## 20. Samajhne ka order (beginner ke liye)

Agar pehli dafa padh rahe ho, is order mein files kholo:

1. `main.dart` → `app.dart`
2. `core/config/app_config.dart` → `core/api/endpoints.dart`
3. `core/api/api_client.dart` → `features/auth/data/auth_repository.dart` → `features/auth/providers/auth_provider.dart`
4. `features/auth/screens/login_screen.dart`
5. `core/router/app_router.dart` → `shared/widgets/main_shell.dart`
6. `features/dashboard/screens/dashboard_screen.dart`
7. `features/courses/data/courses_repository.dart` + `features/courses/screens/courses_screen.dart`
8. Baqi screens — same pattern follow karti hain

---

## 21. Common sawal (FAQ)

**Q: Screen par data kab load hota hai?**  
Jab `ref.watch(provider)` pehli dafa call hota hai — FutureProvider automatically API hit karta hai.

**Q: Login ke baad purana data kyun nahi dikhta?**  
`refreshPortalData()` sab providers invalidate karta hai — fresh API calls.

**Q: Token kahan hai?**  
Phone ki encrypted storage (`flutter_secure_storage`) + memory cache.

**Q: Mock data kab use hota hai?**  
`--dart-define=USE_MOCK=true` — API ke bina test ke liye.

**Q: API URL kahan change karein?**  
`app_config.dart` default ya build/run command mein `API_BASE_URL`.

**Q: App Play Store par local server se chalegi?**  
Nahi — public HTTPS server chahiye. Local IP sirf same WiFi testing ke liye.

**Q: Logo change kiya?**  
Nahi — `assets/images/campus_flow_logo.png` wahi real logo hai.

---

## 22. File list — quick reference

```
lib/main.dart
lib/app.dart
lib/core/config/app_config.dart
lib/core/router/app_router.dart
lib/core/api/api_client.dart
lib/core/api/endpoints.dart
lib/core/api/api_response.dart
lib/core/storage/secure_storage_service.dart
lib/core/storage/session_manager.dart
lib/core/providers/portal_refresh.dart
lib/core/theme/app_colors.dart
lib/core/theme/app_theme.dart
lib/core/models/user_model.dart
lib/core/models/course_model.dart
lib/core/models/schedule_model.dart
lib/core/models/student_grade_model.dart
lib/core/models/assignment_model.dart
lib/features/auth/providers/auth_provider.dart
lib/features/auth/data/auth_repository.dart
lib/features/auth/screens/login_screen.dart
lib/features/dashboard/screens/dashboard_screen.dart
lib/features/courses/data/courses_repository.dart
lib/features/courses/screens/courses_screen.dart
lib/features/courses/screens/course_detail_screen.dart
lib/features/grades/data/grades_repository.dart
lib/features/grades/screens/grades_screen.dart
lib/features/schedule/data/schedule_repository.dart
lib/features/schedule/screens/schedule_screen.dart
lib/features/profile/data/profile_repository.dart
lib/features/profile/screens/profile_screen.dart
lib/features/profile/screens/change_password_screen.dart
lib/features/updates/data/updates_repository.dart
lib/shared/widgets/main_shell.dart
lib/shared/widgets/campus_flow_brand_bar.dart
lib/shared/widgets/campus_flow_logo.dart
lib/shared/widgets/notification_button.dart
lib/shared/widgets/attendance_progress_tile.dart
```

---

*Campus Flow — FYP Student Mobile App Guide*
