// @ts-check
// Pillar-1 (TRUSTWORTHY) E2E — the headline vote journey.
//   login → vote → success → results turnout +1
// Runs against the live dev/preview server (PW_BASE_URL, default :3000) so it
// shares the same DB the owner watches; all mutations are reversed in afterAll.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  uniqueStudentId,
  getBallot,
  turnout,
  forceVotingOpen,
  cleanupE2EUsers,
  disconnect,
} = require('./helpers/fixtures');

/** @type {undefined | (() => Promise<void>)} */
let restoreMode;

test.describe('Vote flow (classic template)', () => {
  test.beforeAll(async () => {
    restoreMode = await forceVotingOpen();
  });

  test.afterAll(async () => {
    if (restoreMode) await restoreMode();
    await cleanupE2EUsers();
    await disconnect();
  });

  test('happy path: login → cast (abstain) → success → results turnout increments', async ({ page }) => {
    const studentId = uniqueStudentId();
    const { abstain } = await getBallot();
    expect(abstain, 'ballot must offer งดออกเสียง (number 0)').toBeTruthy();

    const before = await turnout();

    // 1. login (real NextAuth mock-login) → lands on /vote
    await mockLogin(page, studentId);
    await expect(page.getByRole('heading', { name: /เลือกตั้ง/ })).toBeVisible();

    // 2. cast: select งดออกเสียง → footer confirm bar → confirmation modal
    await page.getByRole('button', { name: 'งดออกเสียง' }).first().click();
    await page.getByRole('button', { name: 'ยืนยันการลงคะแนน' }).click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();

    // 3. success page authorizes the now-voted user
    await page.waitForURL('**/success**', { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'บันทึกคะแนนสำเร็จ!' })).toBeVisible();

    // 4. results turnout reflects the new ballot
    const after = await turnout();
    expect(after).toBeGreaterThanOrEqual(before + 1);
  });
});
