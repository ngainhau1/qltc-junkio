#!/usr/bin/env node
const baseUrl = process.env.BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    const text = await res.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
    return { res, body };
}

async function login(email, password) {
    const { res, body } = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    const token = body.token || body.data?.token;
    if (res.status !== 200 || !token) {
        throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(body)}`);
    }
    return token;
}

async function run() {
    console.log(`[admin-check] BASE_URL=${baseUrl}`);
    const adminToken = await login('admin@junkio.com', 'admin123');
    const staffToken = await login('staff@junkio.com', 'staff123');

    const forbidden = await request('/admin/dashboard', { headers: { Authorization: `Bearer ${staffToken}` } });
    if (forbidden.res.status !== 403) throw new Error(`RBAC failed: staff got ${forbidden.res.status}`);

    const authz = { Authorization: `Bearer ${adminToken}` };

    const dash = await request('/admin/dashboard', { headers: authz });
    if (dash.res.status !== 200) throw new Error('Dashboard failed');

    const ana = await request('/admin/analytics', { headers: authz });
    if (ana.res.status !== 200) throw new Error('Analytics failed');

    const users = await request('/admin/users?page=1&limit=10', { headers: authz });
    const userList = users.body.users || users.body.data?.users || [];
    if (users.res.status !== 200 || userList.length === 0) throw new Error(`Users list failed: status ${users.res.status}, body ${JSON.stringify(users.body)}`);

    const target = userList.find(u => u.email === 'demo@junkio.com') || userList.find(u => u.role !== 'admin');
    if (!target) throw new Error('No non-admin user found for role/lock tests');

    const toAdmin = await request(`/admin/users/${target.id}/role`, {
        method: 'PUT',
        headers: authz,
        body: JSON.stringify({ role: 'admin' }),
    });
    if (toAdmin.res.status !== 200) throw new Error(`Change role to admin failed: ${toAdmin.res.status} ${JSON.stringify(toAdmin.body)}`);
    const backMember = await request(`/admin/users/${target.id}/role`, {
        method: 'PUT',
        headers: authz,
        body: JSON.stringify({ role: 'member' }),
    });
    if (backMember.res.status !== 200) throw new Error(`Change role back failed: ${backMember.res.status} ${JSON.stringify(backMember.body)}`);

    const lock = await request(`/admin/users/${target.id}/toggle-lock`, { method: 'PUT', headers: authz });
    if (lock.res.status !== 200) throw new Error('Lock user failed');
    const unlock = await request(`/admin/users/${target.id}/toggle-lock`, { method: 'PUT', headers: authz });
    if (unlock.res.status !== 200) throw new Error('Unlock user failed');

    const logs = await request('/admin/logs?page=1&limit=10', { headers: authz });
    const logItems = logs.body.logs || logs.body.data?.logs;
    if (logs.res.status !== 200 || !logItems) {
        throw new Error(`Logs failed: status ${logs.res.status}, body ${JSON.stringify(logs.body)}`);
    }

    const fin = await request('/admin/financial-overview', { headers: authz });
    if (fin.res.status !== 200) {
        throw new Error(`Financial overview failed: status ${fin.res.status}, body ${JSON.stringify(fin.body)}`);
    }

    console.log('[admin-check] OK');
}

run().catch(err => {
    console.error('[admin-check] FAILED:', err.message);
    process.exit(1);
});
