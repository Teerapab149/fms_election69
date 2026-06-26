// @ts-check
// Pillar-1 (TRUSTWORTHY) E2E — the must-never-regress voting invariants.
// Each guards a security property the system depends on for 5 years of edits.
//
// Coverage:
//   [x] #1 vote-once — the atomic compare-and-set guard (vote/route.js:109)
//   [x] #2 concurrent double-submit race (one winner, score +1 exactly)
//   [x] #3 ballot secrecy — tally hidden from EVERYONE incl. admin pre-reveal
//   [x] #4 eligibility — voter outside ปี 1-4 is rejected (403)
//   [x] #5 admin-auth — a forged admin_token cookie is rejected (401)
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  uniqueStudentId,
  getBallot,
  candidateScore,
  forceVotingOpen,
  setShowResult,
  createIneligibleUser,
  adminLogin,
  cleanupE2EUsers,
  disconnect,
} = require('./helpers/fixtures');

/** @type {undefined | (() => Promise<void>)} */
let restoreMode;

test.describe('Voting invariants', () => {
  test.beforeAll(async () => {
    restoreMode = await forceVotingOpen();
  });

  test.afterAll(async () => {
    if (restoreMode) await restoreMode();
    await cleanupE2EUsers();
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

  test('#3 ballot secrecy: per-party tally is 0 for everyone — incl. admin — until reveal', async ({ page }) => {
    const restoreReveal = await setShowResult(false);
    try {
      const adminCookie = await adminLogin();

      // Public view: scores masked, not revealed, no turnout breakdown.
      const pub = await (await fetch(API('/api/results'))).json();
      expect(pub.isRevealed).toBe(false);
      for (const c of pub.candidates) expect(c.score, 'public score hidden').toBe(0);
      expect(pub.stats.byYear.length, 'public gets no breakdown').toBe(0);

      // Admin view: NO bypass of the tally — scores still 0 (ballot secrecy,
      // 2026-06-10) — but admin DOES get the live turnout breakdown to chase
      // low-turnout groups.
      const adm = await (
        await fetch(API('/api/results'), { headers: { cookie: adminCookie } })
      ).json();
      expect(adm.isRevealed).toBe(false);
      for (const c of adm.candidates) expect(c.score, 'admin must NOT see the tally pre-reveal').toBe(0);
      expect(adm.stats.byYear.length, 'admin sees turnout breakdown').toBeGreaterThan(0);
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

  test('#5 admin-auth: a forged admin_token cookie is rejected (401)', async ({ page }) => {
    // Plant a bogus cookie in the real browser jar, then hit admin APIs the way
    // the browser would — the JWT verify must reject it (no client-forgeable
    // secret, post P0-1). Mirrors the smoke check through a live context.
    const url = new URL(API('/'));
    await page.context().addCookies([
      { name: 'admin_token', value: 'forged.junk.value', domain: url.hostname, path: '/' },
    ]);
    for (const route of ['/api/admin/dashboard', '/api/admin/config']) {
      const res = await page.request.get(API(route));
      expect(res.status(), `${route} must reject a forged admin_token`).toBe(401);
    }
  });
});
