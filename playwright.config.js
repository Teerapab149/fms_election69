// @ts-check
const { defineConfig } = require('@playwright/test');

// v2-R11: the e2e suite runs against an ISOLATED test DB (`<devName>_e2e`) served
// by `next start` on :3100 — NOT the dev server/DB the owner watches on :3000.
// global.setup.js creates+migrates+seeds the test DB and starts the server;
// global.teardown.js stops the server and truncates the test DB (keeping it).
module.exports = defineConfig({
  testDir: './e2e',
  // admin-console.spec.js is a legacy editor suite (stale red cases, runbook §4.1),
  // not part of the R11 vote-net — keep it out of the default run.
  testIgnore: '**/admin-console.spec.js',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  globalSetup: require.resolve('./e2e/global.setup.js'),
  globalTeardown: require.resolve('./e2e/global.teardown.js'),
  reporter: [
    ['list'],
    ['json', { outputFile: './e2e/test-results.json' }],
  ],
  use: {
    // Isolated test server (prod build + *_e2e DB). Override with PW_BASE_URL only
    // if you deliberately point at another server.
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
