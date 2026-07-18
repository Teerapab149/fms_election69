// @ts-check
// Auth helper — the real student sign-in path used by the e2e specs.
//
// Uses the NextAuth `mock-login` credentials provider (dev-only, registered when
// NODE_ENV !== 'production'; the PANEL renders when the build was made with
// NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true — the local build the R7 gate produces).
// Driving the actual /login UI proves the genuine auth → session → redirect
// chain; the resulting session cookie lives in the page's browser context, so
// page.request.* reuses it for any API-level assertions.
//
// Template note (v2-R11): the seeded activeTemplateId is `receipt`, which falls
// through to the DEFAULT login page — the one carrying the mock panel. Only
// studio-dark / gumroad / verdure swap in their own login chrome.
const { expect } = require('@playwright/test');
const { BASE_PATH } = require('./fixtures');

/**
 * Sign in as `studentId` through the real /login page.
 * @param {import('@playwright/test').Page} page
 * @param {string} studentId
 * @param {{landing?: string}} [opts]  URL glob to wait for after sign-in.
 *   Default '**\/vote**' (an unvoted user's callback). closed.spec passes
 *   '**\/closed**' because the vote page instantly bounces when voting is shut.
 */
async function mockLogin(page, studentId, opts = {}) {
  const landing = opts.landing || '**/vote**';
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

  // NextAuth credential sign-in → callbackUrl /vote; wait for wherever the
  // status gates finally land the user (vote, or closed when voting is shut).
  await page.waitForURL(landing, { timeout: 20000 });
}

module.exports = { mockLogin };
