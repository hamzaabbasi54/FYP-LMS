# FRONTEND_SECRETS Fix Plan

## Changes

No changes required. The frontend is free of hardcoded secrets.

## New files

None.

## Verification goals

- [x] No secret keys in any frontend file
- [x] All sensitive API calls proxy through backend routes
- [x] Only publishable/public keys are in client-side code
- [x] No public env var holds a secret

## Manual verification (for the human)

None required.
