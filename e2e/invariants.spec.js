// @ts-check
// Pillar-1 (TRUSTWORTHY) E2E — the must-never-regress voting invariants.
// Each guards a security property the system depends on for 5 years of edits.
//
// Coverage (this file grows as the test net is built out):
//   [x] #1 vote-once — the atomic compare-and-set guard (vote/route.js:109)
//   [ ] #2 concurrent double-submit race (one winner)
//   [ ] #3 ballot secrecy / anonymize
//   [ ] #4 eligibility (valid years/faculty)
//   [ ] #5 admin-auth (no forged admin_token) — API case already in smoke
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  uniqueStudentId,
  getBallot,
  forceVotingOpen,
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
});
