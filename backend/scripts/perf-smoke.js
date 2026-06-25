const baseUrl = process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000/api';
const email = process.env.LOAD_TEST_EMAIL;
const password = process.env.LOAD_TEST_PASSWORD;
const role = process.env.LOAD_TEST_ROLE || 'deptadmin';
const runs = Number(process.env.LOAD_TEST_RUNS || 5);

const endpoints = (process.env.LOAD_TEST_ENDPOINTS || [
    '/auth/me',
    '/dashboard/stats',
    '/dashboard/enrollment-trends',
    '/dashboard/attendance-overview',
    '/auth/users?page=1&limit=10'
].join(',')).split(',').map(item => item.trim()).filter(Boolean);

const now = () => Number(process.hrtime.bigint() / 1000000n);

const timedFetch = async (path, options = {}) => {
    const started = now();
    const response = await fetch(`${baseUrl}${path}`, options);
    const elapsedMs = now() - started;
    return { response, elapsedMs };
};

const percentile = (values, p) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

if (!email || !password) {
    console.error('Missing LOAD_TEST_EMAIL or LOAD_TEST_PASSWORD.');
    console.error('Example: LOAD_TEST_EMAIL=user@example.com LOAD_TEST_PASSWORD=secret npm run perf:smoke');
    process.exit(1);
}

const login = await timedFetch('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, role })
});

if (!login.response.ok) {
    console.error(`Login failed with status ${login.response.status}.`);
    console.error(await login.response.text());
    process.exit(1);
}

const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
if (!cookie) {
    console.error('Login succeeded, but no auth cookie was returned.');
    process.exit(1);
}

console.log(`Login: ${login.elapsedMs}ms`);
console.log(`Running ${runs} checks for ${endpoints.length} endpoint(s) against ${baseUrl}`);

for (const endpoint of endpoints) {
    const timings = [];
    let failed = 0;

    for (let i = 0; i < runs; i += 1) {
        const result = await timedFetch(endpoint, { headers: { cookie } });
        timings.push(result.elapsedMs);
        if (!result.response.ok) failed += 1;
        await result.response.arrayBuffer();
    }

    const avg = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    console.log(`${endpoint}: avg ${avg.toFixed(0)}ms, p95 ${percentile(timings, 95)}ms, failures ${failed}/${runs}`);
}
