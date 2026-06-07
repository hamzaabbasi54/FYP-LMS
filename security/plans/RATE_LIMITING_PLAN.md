# RATE_LIMITING Fix Plan

## Changes

- `backend/server.js` — Add `app.set('trust proxy', 1)` before configuring the rate limiters. This ensures that the rate limit uses the client's IP from the `X-Forwarded-For` header rather than the proxy's IP, which is required for applications deployed behind modern cloud load balancers or proxy services.

## New files

None.

## Verification goals

- [x] Login, registration, and password reset have rate limiting
- [x] Rate limit triggers after N failed attempts (15 per 15 minutes)
- [x] Rate-limited requests return 429
- [x] Rate limiter correctly uses the client's real IP by trusting the first upstream proxy

## Manual verification (for the human)

- If deploying to an environment with multiple load balancers (e.g., Cloudflare -> AWS ALB), you may need to adjust `trust proxy` to a specific IP or increase the count. For most setups (Render, Vercel, single proxy), `1` is the correct value.
