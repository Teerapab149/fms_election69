// @ts-check
// Auth helper — the real student sign-in path used by the vote-flow tests.
//
// Uses the NextAuth `mock-login` credentials provider (dev-only, gated by
// NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true). Driving the actual /login UI proves the
// genuine auth → session → /vote redirect chain; the resulting session cookie
// lives in the page's browser context, so page.request.* reuses it for any
// API-level assertions (e.g. the vote-once invariant).
//
// Assumes the active template is `classic` (the default login with the mock
// panel). studio-dark / gumroad / verdure render their own login chrome.
const { expect } = require('@playwright/test');
const { BASE_PATH } = require('./fixtures');

/**
 * Sign in as `studentId` through the real /login page and land on /vote.
 * @param {import('@playwright/test').Page} page
 * @param {string} studentId
 */
async function mockLogin(page, studentId) {
  await page.goto(`${BASE_PATH}/login`, { waitUntil: 'networkidle' });

  const input = page.getByPlaceholder('e.g. 6610510149');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  // Type with real keystrokes (not fill) so the controlled-input onChange fires
  // reliably — fill() can land before React attaches its handler, leaving the
  // Mock Login button stuck disabled.
  await input.click();
  await input.pressSequentially(studentId, { delay: 15 });

  // The button only enables once mockStudentId state is set — gate the click on
  // it so a missed keystroke fails loudly here instead of as a flaky click.
  const submit = page.getByRole('button', { name: 'Mock Login' });
  await expect(submit).toBeEnabled({ timeout: 10000 });
  await submit.click();

  // NextAuth credential sign-in → callbackUrl /vote (an unvoted user stays there).
  await page.waitForURL('**/vote**', { timeout: 20000 });
}

module.exports = { mockLogin };
