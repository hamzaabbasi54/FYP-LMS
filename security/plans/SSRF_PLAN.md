# SSRF Fix Plan

## Changes

No changes required. The application does not fetch user-supplied URLs.

## New files

None.

## Verification goals

- [x] All user-supplied URL fetching validates the URL before requesting (N/A)
- [x] Private IP ranges are blocked (N/A)
- [x] Only http and https schemes are allowed (N/A)
- [x] Hostname is resolved and IP checked before the request is made (N/A)

## Manual verification (for the human)

None required.
