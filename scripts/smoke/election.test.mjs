// Critical-path smoke tests — run against a LIVE dev/staging server.
//
//   npm run dev        # in one terminal (or point BASE at staging)
//   node --test scripts/smoke/election.test.mjs
//
// Env: BASE (default http://localhost:3000/fms-ovs), ADMIN_USER, ADMIN_PASS
// (defaults to the dev bootstrap creds). These assert security INVARIANTS that
// must hold no matter the election state — so they double as a pre-deploy gate
// after dependency bumps. NOTE: the rate-limit test trips the login limiter
// (10/5min/IP); if you re-run within 5 min the login test may 429 — wait it out.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://localhost:3000/fms-ovs';
const ADMIN_USER = process.env.ADMIN_USER || '6610510149';
const ADMIN_PASS = process.env.ADMIN_PASS || '6610510149@email.psu.ac.th+ADMIN_FMS2026_2026_secret_9QpZxL';

let adminCookie = '';

before(async () => {
  // sanity: server reachable
  const r = await fetch(BASE, { redirect: 'manual' }).catch(() => null);
  assert.ok(r, `server not reachable at ${BASE} — start it first (npm run dev)`);
});

test('public results: 200 + never leaks a per-party score while hidden', async () => {
  const r = await fetch(`${BASE}/api/results`);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(Array.isArray(j.candidates), 'candidates array present');
  if (j.isRevealed === false) {
    for (const c of j.candidates) assert.equal(c.score, 0, 'hidden results must report score 0');
  }
});

test('admin API rejects no-auth (401)', async () => {
  const r = await fetch(`${BASE}/api/admin/dashboard`);
  assert.equal(r.status, 401);
});

test('admin API rejects a forged admin_token cookie (401)', async () => {
  const r = await fetch(`${BASE}/api/admin/config`, { headers: { cookie: 'admin_token=forged.junk.value' } });
  assert.equal(r.status, 401);
});

test('admin login: wrong password → 401', async () => {
  const r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: 'definitely-wrong' }),
  });
  assert.equal(r.status, 401);
});

test('admin login: correct password → 200 + httpOnly admin_token cookie', async () => {
  const r = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  assert.equal(r.status, 200);
  const setCookie = r.headers.get('set-cookie') || '';
  assert.match(setCookie, /admin_token=/, 'sets admin_token cookie');
  assert.match(setCookie, /HttpOnly/i, 'cookie is HttpOnly');
  adminCookie = setCookie.split(';')[0]; // admin_token=<jwt>
});

test('admin API accepts the valid cookie (200)', async () => {
  assert.ok(adminCookie, 'need cookie from login test');
  const r = await fetch(`${BASE}/api/admin/dashboard`, { headers: { cookie: adminCookie } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.ok(j.stats, 'dashboard returns stats');
});

test('vote requires a session (401 without one)', async () => {
  const r = await fetch(`${BASE}/api/vote`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ candidateId: 1 }),
  });
  assert.equal(r.status, 401);
});

test('login is rate-limited (429 under a burst)', async () => {
  let got429 = false;
  for (let i = 0; i < 14; i++) {
    const r = await fetch(`${BASE}/api/admin/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USER, password: 'x' }),
    });
    if (r.status === 429) { got429 = true; break; }
  }
  assert.ok(got429, 'expected a 429 within the burst');
});
