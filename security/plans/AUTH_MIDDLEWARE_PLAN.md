# AUTH_MIDDLEWARE Fix Plan

## Changes

No changes required. All routes are properly protected.

## New files

None.

## Verification goals

- [x] Every route that returns or modifies user data has auth middleware
- [x] Auth middleware runs before the handler, not inside it (router.use pattern)
- [x] Admin routes check for admin role via `isAdmin` middleware
- [x] Public routes (login, signup, forgot-password) are intentionally unprotected

## Manual verification (for the human)

- Try accessing `/api/students` without a token → should return 401
- Try accessing `/api/dashboard/stats` as faculty → should return 403
