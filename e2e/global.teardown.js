// @ts-check
// e2e/global.teardown.js — playwright globalTeardown for the isolated test DB.
//
// v2-R11: (1) stop the `next start` server spawned by global.setup.js, then
// (2) TRUNCATE every table in the test DB — the DB itself is KEPT so the next
// run is fast (no re-CREATE / re-migrate). The dev DB is never touched: the
// truncate goes through truncateAll(), which asserts current_database() ends
// with "_e2e" before issuing any SQL.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { testPrisma, truncateAll, disconnect, TEST_DB_NAME } = require('./helpers/testDb');

const SERVER_STATE_FILE = path.join(os.tmpdir(), 'fms-e2e-server.json');

function stopServer() {
  let state = null;
  try {
    state = JSON.parse(fs.readFileSync(SERVER_STATE_FILE, 'utf8'));
  } catch {
    return; // nothing recorded (e.g. setup failed before spawn) — nothing to stop
  }
  const pid = state?.pid;
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      // Kill the whole `next start` process tree (npx → node → server workers).
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      // detached spawn → negative pid targets the process group.
      try { process.kill(-pid, 'SIGTERM'); } catch { process.kill(pid, 'SIGTERM'); }
    }
    // eslint-disable-next-line no-console
    console.log(`[e2e teardown] stopped server pid ${pid}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[e2e teardown] could not stop pid ${pid}: ${e?.message || e}`);
  } finally {
    try { fs.unlinkSync(SERVER_STATE_FILE); } catch {}
  }
}

module.exports = async function globalTeardown() {
  stopServer();
  try {
    const db = testPrisma();
    await truncateAll(db); // guarded — refuses anything not ending in _e2e
    // eslint-disable-next-line no-console
    console.log(`[e2e teardown] truncated all tables in ${TEST_DB_NAME} (DB kept)`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[e2e teardown] truncate skipped: ${e?.message || e}`);
  } finally {
    await disconnect();
  }
};
