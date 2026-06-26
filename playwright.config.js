// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  // Sweep any e2e-* users/score drift a crashed run left behind.
  globalTeardown: require.resolve('./e2e/global.teardown.js'),
  reporter: [
    ['list'],
    ['json', { outputFile: './e2e/test-results.json' }],
  ],
  use: {
    // Run against the live dev/preview server (owner watches :3000). Override
    // with PW_BASE_URL when pointing at staging or a dedicated test server.
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
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
