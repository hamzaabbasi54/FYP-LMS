# Campus Flow Performance Production Checklist

## Before Deployment

- Run database backup before applying migrations.
- Apply all backend migrations, including performance indexes.
- Use MySQL in production with enough memory and connection capacity.
- Configure Redis for production session/cache speed.
- Keep `NODE_ENV=production`.
- Use strong `JWT_SECRET`.
- Configure email sender values for Campus Flow.

## Recommended Backend Environment

```env
NODE_ENV=production
DB_POOL_LIMIT=25
DB_POOL_IDLE_LIMIT=10
DB_POOL_IDLE_TIMEOUT_MS=60000
DB_QUEUE_LIMIT=0
REDIS_URL=redis://your-redis-host:6379
```

Increase `DB_POOL_LIMIT` only after confirming MySQL can handle the connections.

## Database

- Run `npm run backup` from the `backend` folder before migrations.
- Run `npm run migrate` from the `backend` folder.
- Confirm indexes exist on users, students, courses, enrollments, attendance, grades, messages, and notifications.
- Keep slow query logging enabled on the production MySQL server during the first testing week.

Safe local order:

```bash
cd backend
npm run backup
npm run migrate
npm run db:indexes
```

The backup file is stored in `backend/backups` by default. Override with `DB_BACKUP_DIR=/your/backup/folder`.

If an existing database has old schema changes but no migration history, `npm run migrate` may stop on an already-existing column. In that case, keep the backup and run `npm run db:indexes` to safely apply only missing performance indexes.

## Frontend

- Run `npm run build` from the `frontend` folder.
- Serve the generated static files with gzip or Brotli compression enabled.
- Cache static JS/CSS assets using long browser cache headers.

## Smoke Performance Test

Run after backend is deployed:

```bash
cd backend
LOAD_TEST_BASE_URL=https://your-domain.com/api \
LOAD_TEST_EMAIL=your-test-user@example.com \
LOAD_TEST_PASSWORD=your-password \
LOAD_TEST_ROLE=deptadmin \
LOAD_TEST_RUNS=10 \
npm run perf:smoke
```

Healthy first targets:

- Login should normally respond in under 800 ms.
- Dashboard stat endpoints should normally respond in under 500 ms after cache warm-up.
- Repeated dashboard requests should be faster after Redis cache is active.

## Still Important For Larger Data

- Add server-side pagination to any future table that can grow large.
- Do not load all records into the frontend for searchable tables.
- Keep Redis enabled for production, not only local fallback memory cache.
- Use a process manager such as PM2 or Docker restart policy so the backend restarts if the process crashes.

## Large Table Status

Server-side pagination is now used for:

- Students
- Parents
- Courses
- Batches
- Curricula
- Manage Users
- Faculty Management
- Assessment and grade records
- Attendance daily records

Monthly attendance report intentionally keeps the month grid available because it is a fixed monthly view, but the table is horizontally scrollable with sticky student/date context in the UI.
