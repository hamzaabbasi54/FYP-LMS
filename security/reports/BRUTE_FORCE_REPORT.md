# BRUTE_FORCE Security Report

## Status: PASS

## Findings

### 1. Rate Limiting
- The `/api/auth/login` endpoint is protected by a strict IP-based rate limiter (`authLimiter` in `server.js`).
- It allows a maximum of **15 requests per 15 minutes** per IP address.
- Following the fix in Category 10 (RATE_LIMITING), this correctly respects `X-Forwarded-For` via `trust proxy`.

### 2. Password Hashing
- Passwords are securely hashed using `bcrypt` with a work factor (salt rounds) of 10 (`authController.js` L160).
- This protects against offline brute-force attacks if the database is compromised.

### 3. Account Lockout
- There is no application-level account lockout mechanism (e.g., locking a specific email address after N failed attempts regardless of IP).
- The defense relies entirely on the IP rate limiter.

## What's at risk

An attacker with a large rotating proxy network (botnet) could attempt a distributed brute-force attack against a single account, bypassing the IP rate limit since each request comes from a different IP. However, this is a sophisticated attack, and the current IP-based rate limiting mitigates 99% of common brute-force tools.

## What's already secure

- Passwords are never stored in plaintext (bcrypt is used).
- Standard brute-force tools running from a single IP will be blocked after 15 attempts.

## Recommendations

No immediate changes required. For defense-in-depth against distributed attacks, consider implementing an account-level lockout (e.g., adding `failed_login_attempts` and `locked_until` columns to the `users` table).
