# SECRETS_EXPOSURE Fix Plan

## Changes

- `backend/.env.example` — Replace real DB_HOST, DB_PORT, DB_USER with placeholders. Add REDIS_URL placeholder.

## New files

None.

## Verification goals

After implementation, ALL of these must be true:

- [x] `git ls-files .env` returns nothing
- [ ] `backend/.env.example` contains NO real hostnames, ports, or usernames
- [ ] `backend/.env.example` contains placeholder for REDIS_URL
- [x] No env var prefixed with VITE_ contains a secret key
- [x] grep for `sk_live_`, `sk_test_`, `AKIA` across all source files returns nothing

## Manual verification (for the human)

- Confirm that after updating `.env.example`, the real `.env` still works (it's separate)
- Consider rotating DB password and Redis credentials if `.env.example` was ever shared publicly
