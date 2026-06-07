# SECRETS_EXPOSURE Security Report

## Status: MEDIUM

## Findings

### 1. `.env` file — NOT tracked by git ✅
- `git ls-files .env` returns nothing
- `.gitignore` includes `.env` at line 3

### 2. Git history — OLD `.env` was committed once
- Commit `32be6cba` (Jan 9, 2026) added `backend/.env` with:
  - `JWT_SECRET=KEY` (generic placeholder)
  - `MONGODB_URI=mongodb://localhost:27017/fyp-lms` (localhost only)
- This is LOW severity — no real credentials were exposed, just a placeholder JWT secret and a local MongoDB URI that is no longer used.

### 3. `.env.example` leaks real infrastructure details
- **File:** `backend/.env.example`
- `DB_HOST=fyp-lms-hamza-abbasi.h.aivencloud.com` — **real cloud database hostname**
- `DB_PORT=13167` — **real port**
- `DB_USER=avnadmin` — **real username**
- Missing `REDIS_URL` placeholder entirely
- These allow an attacker to identify and target the database server (though they'd still need the password).

### 4. Current `.env` contains production secrets
- **File:** `backend/.env` (not tracked, local only)
- Contains real DB password, JWT secret, Gmail app password, Redis URL with embedded credentials
- This is expected — the file is gitignored. But it should be rotated if the `.env.example` was ever shared.

### 5. Frontend — CLEAN ✅
- No secrets in any frontend file
- `VITE_API_URL` only holds a public URL (api.js L3, SocketContext.jsx L27)
- No `VITE_` env vars contain secret keys
- `frontend/.env.example` contains only placeholder URLs

### 6. Source files — CLEAN ✅
- No `sk_live_`, `sk_test_`, `AKIA` patterns found
- No hardcoded Bearer tokens
- No connection strings with credentials in source (except legacy `mongo.js` with `localhost`)

## What's at risk

- An attacker who reads `.env.example` from the GitHub repo can identify the exact Aiven cloud database hostname and port, allowing targeted attacks (brute force, DDoS, or connection attempts with guessed credentials).

## What's already secure

- `.env` is properly gitignored and not tracked
- Frontend contains zero secrets
- JWT secret is a proper 128-char hex string
- All secrets are loaded via `process.env` (no hardcoding)

## Recommendations

1. **HIGH:** Sanitize `backend/.env.example` — replace real DB_HOST, DB_PORT, DB_USER with placeholders
2. **LOW:** Add `REDIS_URL` placeholder to `.env.example`
3. **LOW:** Remove `backend/config/mongo.js` if MongoDB is no longer used
