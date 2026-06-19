# DATABASE_ACCESS Security Report

## Status: LOW

## Findings

This project uses **MySQL** on Aiven Cloud, accessed via `mysql2/promise` connection pool. It does NOT use Supabase, Firebase, or any database with Row-Level Security (RLS) policies.

### Database access architecture
- **Connection:** Single pool defined in `backend/config/db.js`
- **Credentials:** Loaded from `process.env` (DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT)
- **SSL:** Enabled when `DB_SSL=true` (currently active for Aiven Cloud)
- **Pool limits:** `connectionLimit: 10`, `queueLimit: 0`
- **Access control:** Enforced entirely at the application layer via middleware (`verifyToken`, `isAdmin`, `scopeToDepartment`)

### What's secure ✅
- SSL connection enforced for cloud DB
- `rejectUnauthorized: true` in production mode
- Credentials loaded from env vars, not hardcoded
- Connection pool with reasonable limits (10)
- Required env var check in production mode

### What's a concern
- Single `avnadmin` user with full privileges — no read-only user for query routes
- No IP allowlisting documented (Aiven may have this configured)
- `rejectUnauthorized: false` in development mode (acceptable for dev)

## What's at risk

If the DB credentials are compromised, the attacker has **full access** to all tables (no per-table restrictions at the DB level). Access control depends entirely on the application middleware.

## What's already secure

- SSL/TLS encryption in transit
- Application-level access control via JWT + middleware
- Department scoping middleware prevents cross-department access

## Recommendations

1. **LOW:** Consider creating a read-only MySQL user for SELECT-only routes (dashboard, listings)
2. **LOW:** Document IP allowlisting on Aiven Cloud console
3. No RLS changes needed — MySQL doesn't support RLS natively; application-layer control is appropriate
