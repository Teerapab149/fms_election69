// @ts-check
// Safety-net global teardown (playwright.config.js → globalTeardown). Specs
// already reverse their own mutations in afterAll; this catches anything left
// behind by a crashed/interrupted run so the dev DB never accumulates e2e-*
// users or score drift across runs.
const { cleanupE2EUsers, disconnect } = require('./helpers/fixtures');

module.exports = async () => {
  try {
    const { deleted, scoreReversed } = await cleanupE2EUsers();
    if (deleted > 0) {
      console.log(`[e2e teardown] swept ${deleted} leftover e2e users; score reversed:`, scoreReversed);
    }
  } finally {
    await disconnect();
  }
};
