// @ts-check
// Staff rehearsal — docs/ADMIN-GUIDE.md §3-§5 end to end, on the ISOLATED test DB
// (`<devName>_e2e`) + prod build on :3100. The closing night the committee and the
// faculty staff will actually live through, pressed through the REAL admin console
// and the REAL admin API — nothing here flips state behind the app's back except
// the guarded reset in beforeAll/afterAll.
//
//   1. committee signs in at /admin/login (shared password) · box OPEN (MANUAL_OPEN)
//   2. two fresh voters sign in (mock-login) and cast → ballots +2, scores +1 each,
//      HMAC chain verifies
//   3. §5 ขั้นที่ 1  `ปิดหีบตอนนี้ (ENDED)` in the settings tab — `ประกาศผล` was
//      greyed out before it; a /results tab opened now shows the SEALED roll
//   4. §5 ขั้นที่ 2  `ประกาศผล` — the /results tab left open flips to the revealed
//      tally on its own (no reload), and every row equals Candidate.score in the DB
//   5. §5 ขั้นที่ 3  committee presses `รับรองผล` → "ดำเนินการไม่สำเร็จ (403)" with the
//      staff-only message; nothing is certified
//   6. a STAFF account made by the real `scripts/admin.js --create-staff` signs in
//      with ITS OWN password (the shared one is refused for it) and certifies →
//      certifiedBy = the staff's name
//   7. the lock: hide → 409, mode OPEN → 409, date edit → 409, a fresh voter's cast
//      → 403 CERTIFIED (ENDED stays allowed — the guide's "เปลี่ยนโหมดได้แค่ ENDED")
//   8. /results shows the certified banner with the staff's name + the same tally
//
// ⚠️ ordering: specs run alphabetically on one worker, so vote-flow runs AFTER
// this file. Certification persists in globalConfig and /api/vote refuses every
// cast once it is set — so beforeAll AND afterAll both run resetElection():
// guarded raw SQL (assertLiveTestDb → *_e2e only) that strips the certification
// keys + sets showResult=false (the global-config PUT refuses those keys on
// purpose, so there is no API way back — in production that is annual-reset.sql),
// then SET_MODE MANUAL_OPEN through the admin API, which also busts the public
// /api/results snapshot (P-LOG-143). The staff account is deleted in afterAll.
// beforeAll repeats the reset so a retry (retries:1) starts from a clean box.
//
// Admin logins: /api/admin/login allows 10 attempts / 5 min per X-Forwarded-For —
// a bucket every spec's adminLogin() shares — so each login here carries its own
// made-up XFF address.
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const { E2E_ADMIN_PASSWORD, ADMIN_STUDENT_ID } = require('./helpers/seed');
const { assertTestDb, dbNameOf } = require('./helpers/testDb');
const {
  API,
  BASE_PATH,
  TEST_DB_URL,
  prisma,
  assertLiveTestDb,
  uniqueStudentId,
  getBallot,
  ballotStats,
  verifyBallotChain,
  disconnect,
} = require('./helpers/fixtures');

const RUN = `${Date.now()}`;
// e2e- prefix: it is a minted test identity like every other one in this DB
const STAFF_ID = `e2e-staff-${RUN}`;
const STAFF_NAME = 'อีทูอี เจ้าหน้าที่คณะ';

// Texts the guide quotes — asserted verbatim so a wording change that would make
// the guide lie fails here first.
const MSG = {
  staffOnly: 'รับรองผลได้เฉพาะบัญชีเจ้าหน้าที่คณะเท่านั้น — ให้เจ้าหน้าที่เข้าสู่ระบบด้วยบัญชีของตนเองแล้วกดรับรอง',
  hideRefused: 'ผลถูกรับรองแล้ว ซ่อนผลไม่ได้ — ผลที่รับรองแล้วต้องแสดงต่อสาธารณะ',
  modeRefused: 'ผลถูกรับรองแล้ว เปลี่ยนโหมดไม่ได้ — การเลือกตั้งครั้งนี้ปิดอย่างเป็นทางการ',
  datesRefused: 'ผลถูกรับรองแล้ว แก้วันเวลาเลือกตั้งไม่ได้',
  closeConfirm: 'ปิดหีบทันที ไม่รับคะแนนอีก ผลคะแนนยังไม่แสดงจนกว่าจะเปิดการแสดงผล',
  publishConfirm: 'ทุกคนจะเห็นคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์ที่หน้าผลคะแนนทันที เมื่อประกาศแล้ว จะเปิดหีบอีกไม่ได้จนกว่าจะซ่อนผลก่อน',
  published: 'เปิดแสดงผลคะแนนแล้ว ทุกคนดูผลได้ที่หน้าผลคะแนน',
  banner: 'ผลการเลือกตั้งนี้ได้รับการรับรองอย่างเป็นทางการแล้ว',
};

// One made-up client address per login (see header — the login rate limit).
let xffSeq = 0;
const nextXff = () => `198.51.100.${(Number(RUN.slice(-2)) + ++xffSeq) % 250 + 1}`;

// committee admin_token for API calls (and for the reset in beforeAll/afterAll)
let committeeCookie = '';

/** Strip certification + hide results (guarded raw SQL — *_e2e only). */
async function resetCertification() {
  await assertLiveTestDb();
  await prisma().$executeRawUnsafe(
    `UPDATE "SystemConfig"
        SET "showResult" = false,
            "globalConfig" = CASE WHEN "globalConfig" IS NULL THEN NULL
              ELSE "globalConfig" - 'ballotsAnonymized' - 'certifiedAt' - 'certifiedBy' - 'certifiedByUsername' END
      WHERE id = 1`
  );
}

/** Committee login through the API (no browser) → `admin_token=<jwt>`. */
async function apiLogin(username, password) {
  const res = await fetch(API('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': nextXff() },
    body: JSON.stringify({ username, password }),
  });
  const token = ((res.headers.get('set-cookie') || '').match(/admin_token=([^;]+)/) || [])[1];
  return { status: res.status, cookie: token ? `admin_token=${token}` : '' };
}

/** POST /api/admin/dashboard as `cookie` → { status, body }. */
async function dashboard(cookie, body) {
  const res = await fetch(API('/api/admin/dashboard'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Reset the box to "open, nothing published, nothing certified" and bust the
 *  public results snapshot via the real API. Safe to run on a clean DB. */
async function resetElection() {
  await resetCertification();
  if (!committeeCookie) {
    const login = await apiLogin(ADMIN_STUDENT_ID, E2E_ADMIN_PASSWORD);
    if (login.status !== 200) throw new Error(`committee API login → ${login.status}`);
    committeeCookie = login.cookie;
  }
  const r = await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'MANUAL_OPEN' });
  if (r.status !== 200) throw new Error(`reset SET_MODE MANUAL_OPEN → ${r.status} ${JSON.stringify(r.body)}`);
}

/** Sign in at /admin/login through the real form, in its own context. */
async function uiAdminLogin(browser, username, password) {
  const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': nextXff() } });
  const page = await ctx.newPage();
  await page.goto(`${BASE_PATH}/admin/login`);
  await page.getByPlaceholder('Enter admin username').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Login to System/ }).click();
  await page.waitForURL(/\/admin(\?|$)/, { timeout: 20000 });
  return { ctx, page };
}

/** Open the settings tab and wait for the closing-steps card. */
async function openClosingSteps(page) {
  await page.goto(`${BASE_PATH}/admin?tab=settings`);
  await expect(page.getByRole('heading', { name: 'ขั้นตอนปิดการเลือกตั้ง' })).toBeVisible({ timeout: 20000 });
}

/** Press a closing-step button, check the confirm dialog says `confirmText`, confirm. */
async function pressAndConfirm(page, button, confirmTitle, confirmText) {
  const btn = page.getByRole('button', { name: button, exact: true });
  await expect(btn).toBeEnabled({ timeout: 15000 });
  await btn.click();
  await expect(page.getByRole('heading', { name: confirmTitle })).toBeVisible();
  if (confirmText) await expect(page.getByText(confirmText, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
}

/** Read the receipt template's revealed tally off the page: name → score, from
 *  the winner hero (if any) and the standings rows. */
async function readRevealedTally(page) {
  return page.evaluate(() => {
    const out = {};
    const num = (el) => parseInt(String(el?.textContent || '').replace(/[^0-9]/g, ''), 10);
    const hero = document.querySelector('.rc-hero');
    if (hero) out[hero.querySelector('.rc-hero__name')?.textContent?.trim() || '?'] = num(hero.querySelector('.rc-hero__num'));
    for (const row of document.querySelectorAll('.rc-srow')) {
      out[row.querySelector('.rc-srow__name')?.textContent?.trim() || '?'] = num(row.querySelector('.rc-srow__num'));
    }
    return out;
  });
}

/** What the revealed page must show: every option on a 2-party ballot (real
 *  parties + งดออกเสียง — ไม่รับรอง only exists on a single-party ballot), with the
 *  DB's Candidate.score. */
async function dbTally() {
  const rows = await prisma().candidate.findMany({ select: { name: true, number: true, score: true } });
  const parties = rows.filter((c) => c.number > 0);
  const shown = rows.filter((c) => c.number > 0 || c.number === 0 || (c.number === -1 && parties.length === 1));
  return Object.fromEntries(shown.map((c) => [c.name, c.score]));
}

test.describe('Staff rehearsal — ADMIN-GUIDE §3-§5 (isolated test DB)', () => {
  test.beforeAll(async () => {
    // a retry or an earlier aborted run must not start from a certified box
    await resetElection();
    await prisma().user.deleteMany({ where: { studentId: { startsWith: 'e2e-staff-' } } });
  });

  test.afterAll(async () => {
    try {
      await resetElection(); // hands vote-flow an open, uncertified box
    } finally {
      await prisma().user.deleteMany({ where: { studentId: { startsWith: 'e2e-staff-' } } });
      await disconnect();
    }
  });

  test('close → publish → committee refused → staff certifies → locked + banner', async ({ browser }) => {
    test.setTimeout(180_000);
    /** @type {import('@playwright/test').BrowserContext[]} */
    const contexts = [];
    try {
      /** @type {import('@playwright/test').Page} */ let committee;
      /** @type {import('@playwright/test').Page} */ let watcher;

      await test.step('1. committee signs in at /admin/login; the box is OPEN', async () => {
        const s = await uiAdminLogin(browser, ADMIN_STUDENT_ID, E2E_ADMIN_PASSWORD);
        contexts.push(s.ctx);
        committee = s.page;

        await openClosingSteps(committee);
        // §3 ข้อ 5: before closing, step 2 cannot be pressed yet
        await expect(committee.getByRole('button', { name: 'ประกาศผล', exact: true })).toBeDisabled();
        await expect(committee.getByText('หีบยังเปิดรับคะแนนอยู่')).toBeVisible();

        const cfg = await prisma().systemConfig.findUnique({ where: { id: 1 } });
        expect(cfg?.systemMode).toBe('MANUAL_OPEN');
        expect(cfg?.showResult).toBe(false);
        expect(/** @type {any} */ (cfg?.globalConfig)?.ballotsAnonymized ?? false).toBe(false);
      });

      await test.step('2. two fresh voters sign in and cast — box +2, scores +1, chain verifies', async () => {
        const { realParties } = await getBallot();
        expect(realParties.length, 'seed ships 2 real parties').toBe(2);
        const db = prisma();
        const scoreOf = async (id) => (await db.candidate.findUnique({ where: { id }, select: { score: true } }))?.score ?? 0;
        const before = await ballotStats();
        const scoresBefore = [await scoreOf(realParties[0].id), await scoreOf(realParties[1].id)];

        // one voter per real party, each in a context (a session) of its own
        for (const party of realParties) {
          const ctx = await browser.newContext();
          try {
            const page = await ctx.newPage();
            await mockLogin(page, uniqueStudentId());
            const res = await page.request.post(API('/api/vote'), { data: { candidateId: party.id } });
            expect(res.status(), `cast for ${party.name}`).toBe(200);
          } finally {
            await ctx.close();
          }
        }

        const after = await ballotStats();
        expect(after.ballots).toBe(before.ballots + 2);
        expect(after.headSeq).toBe(before.headSeq + 2);
        expect(await scoreOf(realParties[0].id)).toBe(scoresBefore[0] + 1);
        expect(await scoreOf(realParties[1].id)).toBe(scoresBefore[1] + 1);
        const chain = await verifyBallotChain();
        expect(chain.ok, `chain must verify: ${JSON.stringify(chain).slice(0, 300)}`).toBe(true);
      });

      await test.step('3. §5 ขั้นที่ 1 — ปิดหีบตอนนี้ (ENDED); a /results tab shows the sealed roll', async () => {
        await openClosingSteps(committee);
        await pressAndConfirm(committee, 'ปิดหีบตอนนี้ (ENDED)', 'เปลี่ยนเป็น ENDED (ปิดระบบ)?', MSG.closeConfirm);
        await expect(committee.getByText('เปลี่ยนโหมดระบบเป็น ENDED (ปิดระบบ) เรียบร้อยแล้ว')).toBeVisible();
        await committee.getByRole('button', { name: 'ปิด', exact: true }).click();
        await expect(committee.getByText('ปิดด้วยโหมด ENDED')).toBeVisible();

        const cfg = await prisma().systemConfig.findUnique({ where: { id: 1 } });
        expect(cfg?.systemMode).toBe('ENDED');
        expect(cfg?.showResult).toBe(false);

        // A student's /results tab, opened after closing and LEFT OPEN — step 4
        // watches it flip without a reload. Closed + unpublished = sealed roll,
        // no score in the DOM.
        const ctx = await browser.newContext();
        contexts.push(ctx);
        watcher = await ctx.newPage();
        await watcher.goto(`${BASE_PATH}/results`);
        await expect(watcher.locator('section[aria-label="ผลคะแนนถูกผนึกไว้"]')).toBeVisible({ timeout: 20000 });
        await expect(watcher.locator('.rc-srow')).toHaveCount(0);
      });

      await test.step('4. §5 ขั้นที่ 2 — ประกาศผล; the open /results tab flips by itself and equals the DB', async () => {
        await pressAndConfirm(committee, 'ประกาศผล', 'ประกาศผลคะแนน?', MSG.publishConfirm);
        await expect(committee.getByText(MSG.published)).toBeVisible();
        await committee.getByRole('button', { name: 'ปิด', exact: true }).click();
        expect((await prisma().systemConfig.findUnique({ where: { id: 1 } }))?.showResult).toBe(true);

        // "หน้าผลคะแนนที่นักศึกษาเปิดค้างไว้จะเปลี่ยนเป็นผลเองภายในไม่กี่วินาที" — no
        // reload: ENDED polls every 5 s and the reveal busted the public snapshot.
        await expect(watcher.locator('section[aria-label="อันดับคะแนน"]')).toBeVisible({ timeout: 20000 });

        const expected = await dbTally();
        await expect.poll(() => readRevealedTally(watcher), { timeout: 15000 }).toEqual(expected);

        // the public API agrees (isRevealed, same per-option scores, not certified)
        const api = await (await fetch(API('/api/results'))).json();
        expect(api.isRevealed).toBe(true);
        expect(api.certified).toBeNull();
        expect(Object.fromEntries(api.candidates.map((c) => [c.name, c.score]))).toEqual(expected);
        await expect(watcher.getByText(MSG.banner)).toHaveCount(0);
      });

      await test.step('5. §5 ขั้นที่ 3 — committee pressing รับรองผล gets 403 with the staff-only message', async () => {
        await pressAndConfirm(committee, 'รับรองผล', 'รับรองผลอย่างเป็นทางการ?', null);
        const dialog = committee.getByRole('alertdialog');
        await expect(dialog.getByRole('heading', { name: 'ดำเนินการไม่สำเร็จ (403)' })).toBeVisible();
        await expect(dialog.getByText(MSG.staffOnly, { exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'ปิด', exact: true }).click();

        // nothing signed
        const cfg = await prisma().systemConfig.findUnique({ where: { id: 1 } });
        expect(/** @type {any} */ (cfg?.globalConfig)?.ballotsAnonymized ?? false).toBe(false);

        // same refusal straight from the API, for the record
        const r = await dashboard(committeeCookie, { action: 'ANONYMIZE_BALLOTS' });
        expect(r.status).toBe(403);
        expect(r.body.error).toBe(MSG.staffOnly);
      });

      await test.step('6. staff account from scripts/admin.js --create-staff signs in with its own password and certifies', async () => {
        // the real IT command (STAFF-IT-GUIDE), pointed at the test DB only
        if (!TEST_DB_URL) throw new Error('TEST_DB_URL unavailable');
        assertTestDb(dbNameOf(TEST_DB_URL));
        const out = execFileSync(
          process.execPath,
          [path.join('scripts', 'admin.js'), '--create-staff', STAFF_ID, '--name', STAFF_NAME],
          { env: { ...process.env, DATABASE_URL: TEST_DB_URL }, encoding: 'utf8', cwd: process.cwd() }
        );
        const staffPassword = (out.match(/^\s+Password\s+(\S+)\s*$/m) || [])[1] || '';
        expect(staffPassword, `admin.js printed no password:\n${out}`).toMatch(/^[A-Za-z0-9]{20}$/);

        const staff = await prisma().user.findUnique({ where: { studentId: STAFF_ID } });
        expect(staff?.role).toBe('STAFF');
        expect(staff?.isAdmin).toBe(true);
        expect(staff?.year ?? null).toBeNull(); // never an eligible voter
        expect(staff?.name).toBe(STAFF_NAME);

        // the shared committee password does NOT open the staff account
        expect((await apiLogin(STAFF_ID, E2E_ADMIN_PASSWORD)).status).toBe(401);

        // staff signs in through the real form and presses รับรองผล
        const s = await uiAdminLogin(browser, STAFF_ID, staffPassword);
        contexts.push(s.ctx);
        await openClosingSteps(s.page);
        await pressAndConfirm(s.page, 'รับรองผล', 'รับรองผลอย่างเป็นทางการ?', null);
        await expect(s.page.getByRole('heading', { name: 'รับรองผลเรียบร้อย!' })).toBeVisible();
        await s.page.getByRole('button', { name: 'ปิด', exact: true }).click();
        await expect(s.page.getByText('รับรองแล้ว', { exact: true })).toBeVisible();

        const cfg = /** @type {any} */ ((await prisma().systemConfig.findUnique({ where: { id: 1 } }))?.globalConfig);
        expect(cfg?.ballotsAnonymized).toBe(true);
        expect(cfg?.certifiedBy).toBe(STAFF_NAME);
        expect(cfg?.certifiedByUsername).toBe(STAFF_ID);
        expect(Number.isNaN(Date.parse(cfg?.certifiedAt))).toBe(false);

        // H3: certification re-stamps the voters' rows, so no User tuple shares an
        // xmin with a Ballot tuple any more (before it, every ballot paired with
        // its voter through the transaction that cast it).
        const total = (await prisma().$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Ballot"`))[0].n;
        const linked = await prisma().$queryRawUnsafe(
          `SELECT u."studentId", b.seq FROM "User" u JOIN "Ballot" b ON u.xmin = b.xmin ORDER BY b.seq`
        );
        // eslint-disable-next-line no-console
        console.log(`[H3] post-certification xmin join: ${linked.length} of ${total} ballots linked`);
        expect(total).toBeGreaterThan(0);
        expect(linked, 'no voter row may share xmin with a ballot after certification').toHaveLength(0);
        const offHour = await prisma().$queryRawUnsafe(
          `SELECT count(*)::int AS n FROM "User" WHERE "votedAt" IS NOT NULL AND "votedAt" <> date_trunc('hour', "votedAt")`
        );
        expect(offHour[0].n, 'votedAt stays on the hour through the re-stamp').toBe(0);
      });

      await test.step('7. locked: hide, reopen and date edits refused; ENDED allowed; a fresh vote gets CERTIFIED', async () => {
        const cfgBefore = await prisma().systemConfig.findUnique({ where: { id: 1 } });

        // hide → 409 (T11)
        const hide = await dashboard(committeeCookie, { action: 'SET_SHOW_RESULT', value: false });
        expect(hide.status).toBe(409);
        expect(hide.body.error).toBe(MSG.hideRefused);

        // reopen → 409
        const reopen = await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'MANUAL_OPEN' });
        expect(reopen.status).toBe(409);
        expect(reopen.body.error).toBe(MSG.modeRefused);

        // ENDED stays allowed ("เปลี่ยนโหมดได้แค่ ENDED อย่างเดียว")
        expect((await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'ENDED' })).status).toBe(200);

        // date edit → 409, and nothing written
        const put = await fetch(API('/api/admin/global-config'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', cookie: committeeCookie },
          body: JSON.stringify({ globalConfig: { electionStartAt: '2031-01-06T08:30', electionEndAt: '2031-01-07T16:30' } }),
        });
        expect(put.status).toBe(409);
        expect((await put.json()).error).toBe(MSG.datesRefused);

        const cfgAfter = await prisma().systemConfig.findUnique({ where: { id: 1 } });
        expect(cfgAfter?.globalConfig).toEqual(cfgBefore?.globalConfig);
        expect(cfgAfter?.systemMode).toBe('ENDED');
        expect(cfgAfter?.showResult).toBe(true);

        // a fresh, eligible, never-voted student: refused with the stable code
        const { realParty } = await getBallot();
        const ballotsBefore = (await ballotStats()).ballots;
        const ctx = await browser.newContext();
        try {
          const page = await ctx.newPage();
          // the box is closed, so the vote page bounces on — the session is what
          // we need, wherever the page ends up
          await mockLogin(page, uniqueStudentId(), { landing: (url) => !url.pathname.endsWith('/login') });
          const res = await page.request.post(API('/api/vote'), { data: { candidateId: realParty.id } });
          expect(res.status()).toBe(403);
          expect((await res.json()).code).toBe('CERTIFIED');
        } finally {
          await ctx.close();
        }
        expect((await ballotStats()).ballots).toBe(ballotsBefore);
      });

      await test.step('8. /results shows the certified banner with the staff name and the same tally', async () => {
        // a fresh load, the way the committee prints it (Ctrl+P) for the report
        await watcher.reload();
        await expect(watcher.getByText(MSG.banner)).toBeVisible({ timeout: 20000 });
        await expect(watcher.locator('.certified-banner')).toContainText(`รับรองโดย ${STAFF_NAME}`);
        await expect(watcher.locator('section[aria-label="อันดับคะแนน"]')).toBeVisible();
        await expect.poll(() => readRevealedTally(watcher), { timeout: 15000 }).toEqual(await dbTally());

        const api = await (await fetch(API('/api/results'))).json();
        expect(api.isRevealed).toBe(true);
        expect(api.certified?.by).toBe(STAFF_NAME);
      });
    } finally {
      for (const ctx of contexts) await ctx.close().catch(() => {});
    }
  });
});
