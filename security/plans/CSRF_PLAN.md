# CSRF Fix Plan

## Changes

- `backend/controllers/authController.js` — Change the `sameSite` cookie attribute to always be `'lax'` instead of checking `NODE_ENV` and setting to `'none'`.

## New files

None.

## Verification goals

After implementation, ALL of these must be true:

- [x] Session cookies have SameSite set to Lax or Strict
- [x] Cross-origin forms will fail to authenticate automatically

## Manual verification (for the human)

- Verify that login still works from the frontend running on `http://localhost:5173`. Since the backend is on `localhost:3000`, `sameSite: 'lax'` allows top-level navigation and same-site requests (localhost is treated as same-site for ports).
