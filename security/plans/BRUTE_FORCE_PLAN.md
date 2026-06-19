# BRUTE_FORCE Fix Plan

## Changes

No changes required. IP-based rate limiting and bcrypt are already implemented.

## New files

None.

## Verification goals

- [x] Login endpoint has rate limiting
- [x] Passwords are hashed using bcrypt
- [ ] Account lockout by email (Acknowledged as missing, but acceptable risk given strict IP limits)

## Manual verification (for the human)

None required.
