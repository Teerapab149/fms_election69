// @ts-check
// v2-R11 Pillar-1 (TRUSTWORTHY) E2E — the must-never-regress voting invariants,
// on the ISOLATED test DB + `next start` :3100.
//
// Coverage:
//   [x] #1 vote-once — the atomic compare-and-set guard (vote/route.js)
//   [x] #2 concurrent double-submit race (one winner, score +1 exactly)
//   [x] #3 results embargo — tally hidden from EVERYONE incl. admin pre-reveal
//        (API masks score to 0 + no public breakdown) and the /results PAGE
//        never puts a real score in the DOM
//   [x] #4 eligibility — voter outside ปี 1-4 is rejected (403)
//   [x] #5 admin-auth — no cookie → 401 · forged admin_token → 401 ·
//        readiness without auth → 401
//   [x] #6 /api/vote without a session → 401
//
// AUDIT vs the pre-R11 file (report each change):
//   - `/api/admin/config` probe REMOVED — that route was deleted in ADM-3 (it
//     404s now, which would fail a 401 assertion). Canonical admin surfaces
//     probed instead: /api/admin/dashboard + /api/admin/readiness.
//   - specs no longer snapshot/restore dev state or delete voted users mid-run —
//     the DB is disposable (*_e2e) and global.teardown truncates it. Deleting a
//     voted user mid-suite would break the ballots==voted certification tie for
//     later specs.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  uniqueStudentId,
  getBallot,
  candidateScore,
  setShowResult,
  createIneligibleUser,
  adminLogin,
  disconnect,
} = require('./helpers/fixtures');

test.describe('Voting invariants (isolated test DB)', () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test('#1 vote-once: a second submit on the same session is rejected (403)', async ({ page }) => {
    const studentId = uniqueStudentId();
    const { abstain, realParty } = await getBallot();
    const choice = (abstain || realParty).id;

    // Sign in (session cookie now lives in the page context → page.request reuses it).
    await mockLogin(page, studentId);

    const first = await page.request.post(API('/api/vote'), { data: { candidateId: choice } });
    expect(first.status(), 'first vote should succeed').toBe(200);
    expect((await first.json()).success).toBe(true);

    const second = await page.request.post(API('/api/vote'), { data: { candidateId: choice } });
    expect(second.status(), 'second vote must be rejected by the atomic guard').toBe(403);
    expect((await second.json()).error).toMatch(/ใช้สิทธิ/);
  });

  test('#2 race: two concurrent submits → exactly one wins, score +1 only', async ({ page }) => {
    const studentId = uniqueStudentId();
    const { realParty } = await getBallot();

    await mockLogin(page, studentId);
    const before = await candidateScore(realParty.id);

    // Fire both at once — the TOCTOU window (P0-2) is exactly here.
    const [a, b] = await Promise.all([
      page.request.post(API('/api/vote'), { data: { candidateId: realParty.id } }),
      page.request.post(API('/api/vote'), { data: { candidateId: realParty.id } }),
    ]);
    const statuses = [a.status(), b.status()].sort();
    expect(statuses, 'exactly one 200 and one 403').toEqual([200, 403]);

    // The decisive integrity check: the compare-and-set incremented the score
    // once, never twice — even under a dead heat.
    const after = await candidateScore(realParty.id);
    expect(after).toBe(before + 1);
  });

  test('#3 results embargo: tally hidden for everyone — incl. admin — and the page leaks nothing', async ({ page }) => {
    const restoreReveal = await setShowResult(false);
    try {
      const adminCookie = await adminLogin();

      // Public API: scores masked, not revealed, no turnout breakdown.
      const pub = await (await fetch(API('/api/results'))).json();
      expect(pub.isRevealed).toBe(false);
      for (const c of pub.candidates) expect(c.score, 'public score hidden').toBe(0);
      expect(pub.stats.byYear.length, 'public gets no breakdown').toBe(0);

      // Admin API: NO bypass of the tally (ballot secrecy, 2026-06-10) — but
      // admin DOES get the live turnout breakdown to chase low-turnout groups.
      const adm = await (
        await fetch(API('/api/results'), { headers: { cookie: adminCookie } })
      ).json();
      expect(adm.isRevealed).toBe(false);
      for (const c of adm.candidates) expect(c.score, 'admin must NOT see the tally pre-reveal').toBe(0);
      expect(adm.stats.byYear.length, 'admin sees turnout breakdown').toBeGreaterThan(0);

      // /results PAGE: with a real nonzero tally in the DB (earlier specs voted),
      // the true per-party score must never enter the DOM pre-reveal (the receipt
      // results page renders a SEALED roll — standings only render revealed).
      const { realParty } = await getBallot();
      const trueScore = await candidateScore(realParty.id);
      expect(trueScore, 'precondition: some real votes exist by now').toBeGreaterThan(0);
      await page.goto('/results');
      await page.waitForLoadState('networkidle');
      const body = await page.locator('body').innerText();
      expect(body, 'no per-party score digits on the embargoed results page')
        .not.toMatch(new RegExp(`${realParty.name}[\\s\\S]{0,80}${trueScore}`));
    } finally {
      await restoreReveal();
    }
  });

  test('#4 eligibility: a voter outside ปี 1-4 is rejected (403)', async ({ page }) => {
    const studentId = await createIneligibleUser(); // year "ปี 5"
    const { abstain, realParty } = await getBallot();
    const choice = (abstain || realParty).id;

    await mockLogin(page, studentId);
    const res = await page.request.post(API('/api/vote'), { data: { candidateId: choice } });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toMatch(/ชั้นปีที่ 1-4/);
  });

  test('#5 admin-auth: no cookie → 401, forged cookie → 401 (dashboard + readiness)', async ({ page }) => {
    // No auth at all.
    for (const route of ['/api/admin/dashboard', '/api/admin/readiness']) {
      const r = await fetch(API(route));
      expect(r.status, `${route} without auth must be 401`).toBe(401);
    }

    // Forged cookie planted in the real browser jar, requests made the way the
    // browser would — the JWT verify must reject it (post P0-1: no
    // client-forgeable secret). NOTE: /api/admin/config was removed in ADM-3;
    // dashboard + readiness are the canonical guarded admin surfaces.
    const url = new URL(API('/'));
    await page.context().addCookies([
      { name: 'admin_token', value: 'forged.junk.value', domain: url.hostname, path: '/' },
    ]);
    for (const route of ['/api/admin/dashboard', '/api/admin/readiness']) {
      const res = await page.request.get(API(route));
      expect(res.status(), `${route} must reject a forged admin_token`).toBe(401);
    }
  });

  test('#6 vote requires a session (401 without one)', async () => {
    const { realParty } = await getBallot();
    const r = await fetch(API('/api/vote'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId: realParty.id }),
    });
    expect(r.status).toBe(401);
  });
});
