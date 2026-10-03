// @ts-check
// H3 third linkage: PHYSICAL ORDER of the voter rows. A vote UPDATEs the User row,
// which writes a new tuple version at a new ctid roughly in cast order; and the
// tuple's xmin is a transaction id that also grows with cast order. If the order
// of voters by ctid (or by xmin) equals cast order, it equals Ballot.seq order,
// which is a pairing that needs neither the RSA key nor the exact timestamp.
//
// Measured on the isolated test DB: CAST voters are minted through the real
// /api/vote one after another (so cast order == seq order is known), then the
// order of THOSE voters by ctid and by xmin is compared with it — before and after
// the real certification (staff account made by scripts/admin.js, ANONYMIZE_BALLOTS).
// Reported as exact positional matches and Spearman rho (1 = same order,
// ~0 = unrelated). The certification block must leave rho near 0.
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const { E2E_ADMIN_PASSWORD, ADMIN_STUDENT_ID } = require('./helpers/seed');
const { assertTestDb, dbNameOf } = require('./helpers/testDb');
const {
  API,
  TEST_DB_URL,
  prisma,
  assertLiveTestDb,
  uniqueStudentId,
  getBallot,
  disconnect,
} = require('./helpers/fixtures');

const CAST = Number(process.env.H3_CAST || 20);
const RUN = `${Date.now()}`;
const STAFF_ID = `e2e-staff-order-${RUN}`;
let xff = 0;
const nextXff = () => `203.0.113.${(Number(RUN.slice(-2)) + ++xff) % 250 + 1}`;

async function apiLogin(username, password) {
  const res = await fetch(API('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': nextXff() },
    body: JSON.stringify({ username, password }),
  });
  const token = ((res.headers.get('set-cookie') || '').match(/admin_token=([^;]+)/) || [])[1];
  return { status: res.status, cookie: token ? `admin_token=${token}` : '' };
}
async function dashboard(cookie, body) {
  const res = await fetch(API('/api/admin/dashboard'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
async function resetElection() {
  await assertLiveTestDb();
  await prisma().$executeRawUnsafe(
    `UPDATE "SystemConfig" SET "showResult" = false,
       "globalConfig" = CASE WHEN "globalConfig" IS NULL THEN NULL
         ELSE "globalConfig" - 'ballotsAnonymized' - 'certifiedAt' - 'certifiedBy' - 'certifiedByUsername' END
     WHERE id = 1`
  );
  const login = await apiLogin(ADMIN_STUDENT_ID, E2E_ADMIN_PASSWORD);
  if (login.status !== 200) throw new Error(`committee login → ${login.status}`);
  const r = await dashboard(login.cookie, { action: 'SET_MODE', mode: 'MANUAL_OPEN' });
  if (r.status !== 200) throw new Error(`reset SET_MODE → ${r.status}`);
}

/** order[i] = studentId at physical/xmin position i (only the voters we cast). */
function agreement(castOrder, observed) {
  const n = castOrder.length;
  const rank = new Map(observed.map((id, i) => [id, i]));
  let exact = 0;
  let d2 = 0;
  castOrder.forEach((id, i) => {
    const r = rank.get(id);
    if (r === i) exact++;
    d2 += (r - i) ** 2;
  });
  const rho = 1 - (6 * d2) / (n * (n * n - 1));
  return { exact, n, rho: Math.round(rho * 1000) / 1000 };
}

async function observedOrders(castOrder) {
  const ids = castOrder;
  const byCtid = (await prisma().$queryRawUnsafe(
    `SELECT "studentId" FROM "User" WHERE "studentId" = ANY($1::text[]) AND "isVoted" ORDER BY ctid`, ids
  )).map((r) => r.studentId);
  const byXmin = (await prisma().$queryRawUnsafe(
    `SELECT "studentId" FROM "User" WHERE "studentId" = ANY($1::text[]) AND "isVoted" ORDER BY xmin::text::bigint`, ids
  )).map((r) => r.studentId);
  const raw = await prisma().$queryRawUnsafe(
    `SELECT "studentId", ctid::text AS tid, xmin::text AS xmin FROM "User" WHERE "studentId" = ANY($1::text[]) AND "isVoted" ORDER BY "User".ctid`, ids
  );
  return { byCtid, byXmin, raw };
}

test.describe('Voter-row physical order vs cast order (H3)', () => {
  test.afterAll(async () => {
    try { await resetElection(); } finally {
      await prisma().user.deleteMany({ where: { studentId: { startsWith: 'e2e-staff-order-' } } });
      await disconnect();
    }
  });

  test(`order of ${CAST} voters by ctid / xmin vs cast order, before and after certification`, async ({ browser }) => {
    test.setTimeout(420_000);
    await resetElection();
    const { realParties } = await getBallot();
    const castOrder = [];
    for (let i = 0; i < CAST; i++) {
      const id = uniqueStudentId();
      castOrder.push(id);
      const ctx = await browser.newContext();
      try {
        const page = await ctx.newPage();
        await mockLogin(page, id);
        const res = await page.request.post(API('/api/vote'), { data: { candidateId: realParties[i % 2].id } });
        expect(res.status(), `cast #${i + 1}`).toBe(200);
      } finally {
        await ctx.close();
      }
    }

    const before = await observedOrders(castOrder);
    // eslint-disable-next-line no-console
    console.log(`[H3-order] PRE-cert  ctid : ${JSON.stringify(agreement(castOrder, before.byCtid))}`);
    // eslint-disable-next-line no-console
    console.log(`[H3-order] PRE-cert  xmin : ${JSON.stringify(agreement(castOrder, before.byXmin))}`);
    // eslint-disable-next-line no-console
    console.log('[H3-order] PRE-cert first rows (ctid, xmin, cast index):\n' + before.raw.slice(0, 6).map((r) => `  ${r.tid}  xmin ${r.xmin}  #${castOrder.indexOf(r.studentId) + 1}`).join('\n'));

    // real closing sequence, real STAFF account
    assertTestDb(dbNameOf(TEST_DB_URL));
    const out = execFileSync(process.execPath, [path.join('scripts', 'admin.js'), '--create-staff', STAFF_ID, '--name', 'H3 order staff'],
      { env: { ...process.env, DATABASE_URL: TEST_DB_URL }, encoding: 'utf8', cwd: process.cwd() });
    const pw = (out.match(/^\s+Password\s+(\S+)\s*$/m) || [])[1];
    const committee = await apiLogin(ADMIN_STUDENT_ID, E2E_ADMIN_PASSWORD);
    expect((await dashboard(committee.cookie, { action: 'SET_MODE', mode: 'ENDED' })).status).toBe(200);
    expect((await dashboard(committee.cookie, { action: 'SET_SHOW_RESULT', value: true })).status).toBe(200);
    const staff = await apiLogin(STAFF_ID, pw);
    expect(staff.status).toBe(200);
    const cert = await dashboard(staff.cookie, { action: 'ANONYMIZE_BALLOTS' });
    expect(cert.status, JSON.stringify(cert.body)).toBe(200);

    const after = await observedOrders(castOrder);
    // eslint-disable-next-line no-console
    console.log(`[H3-order] POST-cert ctid : ${JSON.stringify(agreement(castOrder, after.byCtid))}`);
    // eslint-disable-next-line no-console
    console.log(`[H3-order] POST-cert xmin : ${JSON.stringify(agreement(castOrder, after.byXmin))}`);
    // eslint-disable-next-line no-console
    console.log('[H3-order] POST-cert first rows (ctid, xmin, cast index):\n' + after.raw.slice(0, 6).map((r) => `  ${r.tid}  xmin ${r.xmin}  #${castOrder.indexOf(r.studentId) + 1}`).join('\n'));

    // after certification the physical order must not track cast order
    // A uniformly random order of 20 has |rho| > 0.85 with probability 6e-6 (Monte Carlo, 4e6 permutations: 25 hits), so a false fail is negligible; the unfixed behaviour measured rho = 1.0.
    expect(Math.abs(agreement(castOrder, after.byCtid).rho), 'ctid order vs cast order after certification').toBeLessThan(0.85);
  });
});
