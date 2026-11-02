// @ts-check
// The admin test tools on a production build: allowed only when the switch is on
// AND the database is a throwaway one (utils/testTools.mjs), and every attempt
// leaves an audit row. Needs a server started with ADMIN_TEST_TOOLS=1, so it is
// skipped in the normal gate (that server has the tools off, which
// staff-rehearsal checks: 404):
//
//   ADMIN_TEST_TOOLS=1 npx playwright test test-tools-audit
//
// The refusal on a REAL database name is covered by scripts/smoke/testTools.test.mjs
// (a production server on a non-throwaway DB cannot be started here: mock-login,
// which the suite signs in with, only exists on a database whose name ends in _e2e).
const { test, expect } = require('@playwright/test');
const { E2E_ADMIN_PASSWORD, ADMIN_STUDENT_ID } = require('./helpers/seed');
const { API, prisma, assertLiveTestDb, disconnect } = require('./helpers/fixtures');

test.skip(process.env.ADMIN_TEST_TOOLS !== '1', 'start the suite with ADMIN_TEST_TOOLS=1 to run this');

test.afterAll(async () => { await disconnect(); });

test('on a throwaway database the tools answer, and each attempt is audited with the database name', async () => {
  await assertLiveTestDb();
  const login = await fetch(API('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '192.0.2.77' },
    body: JSON.stringify({ username: ADMIN_STUDENT_ID, password: E2E_ADMIN_PASSWORD }),
  });
  expect(login.status).toBe(200);
  const cookie = `admin_token=${((login.headers.get('set-cookie') || '').match(/admin_token=([^;]+)/) || [])[1]}`;
  const call = (method, body) => fetch(API('/api/admin/test-tools'), {
    method,
    headers: { 'Content-Type': 'application/json', cookie },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const status = await call('GET');
  expect(status.status).toBe(200);
  expect((await status.json()).enabled).toBe(true);

  const before = await prisma().adminAuditLog.count({ where: { action: { startsWith: 'TEST_TOOL_' } } });
  const unknown = await call('POST', { action: 'NOPE' });
  expect(unknown.status).toBe(400);
  // refused because ballots are in the box (or done, on an empty one): either way, one row
  const clear = await call('POST', { action: 'CLEAR_TEST_VOTERS' });
  expect([200, 409]).toContain(clear.status);

  const rows = await prisma().adminAuditLog.findMany({
    where: { action: { startsWith: 'TEST_TOOL_' } },
    orderBy: { id: 'desc' },
    take: 2,
  });
  expect(await prisma().adminAuditLog.count({ where: { action: { startsWith: 'TEST_TOOL_' } } })).toBe(before + 2);
  const [last, prev] = rows.map((r) => ({ ...r, detail: JSON.parse(r.detail || '{}') }));
  expect(last.action).toBe('TEST_TOOL_CLEAR_TEST_VOTERS');
  expect(last.detail.result).toBe(clear.status === 200 ? 'ok' : 'refused 409');
  expect(prev.action).toBe('TEST_TOOL_NOPE');
  expect(prev.detail.result).toBe('refused 400');
  for (const r of [last, prev]) {
    expect(r.actor).toBe(ADMIN_STUDENT_ID);
    expect(r.detail.database).toMatch(/_e2e$/);
  }
});
