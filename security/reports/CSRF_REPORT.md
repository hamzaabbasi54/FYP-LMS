# CSRF Security Report

## Status: HIGH

## Findings

### 1. Cookie Configuration
In `backend/controllers/authController.js` (L227), the session token cookie is set with the following options:

```javascript
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

When `NODE_ENV=production`, `sameSite` is explicitly set to `none`.

### 2. CSRF Token Implementation
A search for `csrf` across the backend source code returned no results. The application does not use CSRF tokens.

## What's at risk

Because the session token is stored in an HTTP-Only cookie and `sameSite` is set to `none` in production without any CSRF tokens, the application is highly vulnerable to Cross-Site Request Forgery (CSRF).

An attacker could create a malicious website containing a hidden form targeting a state-changing endpoint (e.g., `POST /api/students`, `DELETE /api/assessments/1`, `PUT /api/auth/profile`). If an authenticated user visits the attacker's site, their browser will automatically send the `token` cookie with the request, executing the action on the user's behalf.

*Note: CORS does not prevent CSRF for "simple requests" like form submissions, because CORS only blocks reading the response, not sending the initial request.*

## What's already secure

- The cookie is `httpOnly: true`, preventing XSS from stealing the token directly.
- The cookie is `secure: true` in production, ensuring it's only sent over HTTPS.
- In development mode, `sameSite` defaults to `lax`, which is safe.

## Recommendations

1. **HIGH:** Change the cookie configuration to always use `sameSite: 'strict'` or `sameSite: 'lax'` in production as well. If the frontend and backend are hosted on the same domain (or subdomains of the same domain, e.g., `api.example.com` and `app.example.com`), `lax` or `strict` will work perfectly and completely eliminate CSRF.
2. If cross-origin credentials are strictly required and `sameSite: 'none'` must be used, implement a robust CSRF token mechanism (e.g., Double Submit Cookie pattern). Given this is a standard web app, `lax` is almost certainly the correct choice.
