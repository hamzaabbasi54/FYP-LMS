# Campus Flow — Play Store Release Guide

## Release files

| File | Use |
|------|-----|
| `release/CampusFlow-1.0.0-playstore.aab` | Google Play Console upload |
| `release/CampusFlow-1.0.0-release.apk` | Direct install on phone (share/sideload) |

---

## Pehli dafa build kaise banayein

Terminal mein:

```bash
cd fyp_student_app
chmod +x scripts/build_playstore.sh
./scripts/build_playstore.sh https://APNA-SERVER.com/api
```

`https://APNA-SERVER.com/api` ki jagah apna **live HTTPS backend URL** lagayein.

---

## Signing key (bahut zaroori — save kar ke rakhein)

| Item | Value |
|------|-------|
| Keystore file | `android/app/campus-flow-release.jks` |
| Alias | `campusflow` |
| Store password | `CampusFlow2026!` |
| Key password | `CampusFlow2026!` |

> **Warning:** Agar yeh file ya password kho gaya to Play Store par app update nahi kar paoge. Backup zaroor rakhein.

---

## Google Play Console steps

1. [Google Play Console](https://play.google.com/console) par account banayein ($25 one-time fee)
2. **Create app** → naam: `Campus Flow`
3. **Package name:** `com.campusflow.student` (change nahi karna)
4. **Production** → **Create new release**
5. `release/CampusFlow-*.aab` file upload karein
6. Store listing bharein:
   - Short description
   - Full description
   - Screenshots (phone)
   - App icon 512×512
   - Feature graphic 1024×500
7. **Privacy policy URL** (zaroori — koi bhi hosted page)
8. Content rating questionnaire complete karein
9. Submit for review

---

## App details (Play Store listing ke liye)

| Field | Value |
|-------|-------|
| App name | Campus Flow |
| Package | com.campusflow.student |
| Category | Education |
| Version | 1.0.0 |

**Short description (80 chars):**
```
Student portal for courses, grades, attendance, schedule & announcements.
```

**Full description:**
```
Campus Flow is the official student mobile app for your university LMS.

Features:
• Login with your student account
• View enrolled courses and attendance
• Check quiz, assignment, midterm & final marks
• See your weekly class schedule
• Get teacher announcements and updates
• Manage your profile and change password

Built for students — simple, fast, and connected to your campus database.
```

---

## Agli update ke liye

1. `pubspec.yaml` mein version badhayein, e.g. `1.0.1+2`
2. Dobara `./scripts/build_playstore.sh` chalayein
3. Nayi AAB Play Console par upload karein

---

## Production checklist

- [ ] Backend **HTTPS** par deployed ho (HTTP Play Store apps ke liye theek nahi)
- [ ] `API_BASE_URL` production server ho (local IP `10.x.x.x` nahi)
- [ ] Keystore backup safe jagah par ho
- [ ] Privacy policy page live ho
- [ ] Test account Play Console review ke liye ready ho
