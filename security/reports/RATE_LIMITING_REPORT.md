# RATE_LIMITING Security Report

## Status: MEDIUM

## Findings

### Rate Limiters Configuration
The application correctly configures rate limiters in `backend/server.js` using `express-rate-limit`:

1. **Global Limiter (`/api`):** 1000 requests per 15 minutes.
2. **Auth Limiter (`/api/auth/login`, `/forgot-password`, `/reset-password`, `/set-password`):** 15 requests per 15 minutes.
3. **Message Limiter:** 30 requests per 1 minute.

### `trust proxy` setting
The Express application does not have `app.set('trust proxy', 1 /* number of proxies */)` configured. 

## What's at risk

Without `trust proxy` configured, if the Node.js backend is deployed behind a reverse proxy or load balancer (which is common in production environments like AWS ALB, Nginx, Render, Heroku), Express will see the proxy's internal IP address instead of the actual client's IP. 

This leads to two problems:
1. **Global Denial of Service:** The rate limiter will count all traffic across all users against the proxy's IP. The limit of 15 auth attempts per 15 minutes will be reached almost immediately by just a few normal users, locking everyone out.
2. **Bypass Potential:** If `trust proxy` is enabled incorrectly or without specifying the number of proxies, attackers can spoof the `X-Forwarded-For` header to bypass the rate limit.

## What's already secure

- Critical authentication endpoints (login, forgot password, reset password, set password) are specifically protected by a much stricter limiter (15 requests / 15 mins).
- A global rate limit acts as a baseline defense against general flooding.

## Recommendations

1. **MEDIUM:** If the application is deployed behind a reverse proxy, add `app.set('trust proxy', 1 /* or specific proxy count/IPs */)` to `server.js` before applying the rate limiters, so that limits apply to real client IPs rather than the proxy.
