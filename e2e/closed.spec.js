// @ts-check
// v2-R11 — election closed (systemMode ENDED): /vote bounces to /closed, the
// closed page renders the ENDED story, and the vote API refuses the cast.
// Isolated test DB + :3100.
//
// State handling: systemMode is flipped to ENDED via the fixtures helper (Prisma
// client BOUND to the *_e2e DB; raw SQL paths additionally assert
// current_database() ends with _e2e) and restored to the previous mode in
// afterAll so the later spec files in the same run still see voting open.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  uniqueStudentId,
  getBallot,
  setSystemMode,
  disconnect,
} = require('./helpers/fixtures');

/** @type {undefined | (() => Promise<void>)} */
let restoreMode;

test.describe('Closed election (systemMode ENDED) — isolated test DB', () => {
  test.beforeAll(async () => {
    restoreMode = await setSystemMode('ENDED');
  });

  test.afterAll(async () => {
    if (restoreMode) await restoreMode();
    await disconnect();
  });

  test('voter is bounced to /closed, sees the ENDED page, and the API refuses the cast', async ({ page }) => {
    const studentId = uniqueStudentId();
    const { realParty } = await getBallot();

    // Login still works (auth is independent of election mode); the vote page's
    // status gate then hard-navigates to /closed — wait for the final landing.
    await mockLogin(page, studentId, { landing: '**/closed**' });

    // Receipt closed page, ENDED variant (closed/page.js → ReceiptClosed h1).
    await expect(
      page.getByRole('heading', { name: 'สิ้นสุดระยะเวลาลงคะแนน' })
    ).toBeVisible({ timeout: 15000 });

    // API refuses the cast outright (mode gate runs before any DB write).
    const res = await page.request.post(API('/api/vote'), { data: { candidateId: realParty.id } });
    expect(res.status(), 'ENDED mode must refuse the vote').toBe(403);
    expect((await res.json()).error).toMatch(/สิ้นสุด/);
  });
});
