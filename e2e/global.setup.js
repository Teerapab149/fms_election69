// @ts-check
// e2e/global.setup.js — playwright globalSetup for the ISOLATED test DB + server.
//
// Order (fail-fast first so a dry run never touches a DB):
//   1. require .next/BUILD_ID — the suite runs against a PROD build (`next start`).
//      Missing → throw a friendly "run `next build` first" (no DB, no server).
//   2. ensure `<devName>_e2e` exists (CREATE DATABASE if missing).
//   3. sync the schema onto the test DB with `prisma db push` — NOT
//      `migrate deploy`: the committed migration history is INCOMPLETE (columns
//      like SystemConfig.systemMode / googleFormUrl / globalConfig were added
//      via db push in dev and never captured as migrations), so migrate deploy
//      on a fresh DB produces a stale schema (discovered v2-R11, flagged).
//   4. seed the small fixture.
//   5. spawn `next start -p 3100` with DATABASE_URL → test DB, wait until healthy.
//   6. record the server pid so global.teardown can stop it.
//
// Runnable standalone (`npm run e2e:setup`) — that is also how we demonstrate the
// polite BUILD_ID fail-fast without a build present.
//
// NOTE (v2-R11, documented in the report + runbook): the server is started with
// NODE_ENV=development on purpose. `next start` still serves the prod .next
// build, but (a) NextAuth registers the dev-only `mock-login` provider (its gate
// is NODE_ENV !== 'production'), and (b) session cookies are non-Secure so they
// survive http://localhost. Neither weakens the real production build.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const {
  TEST_DB_URL,
  TEST_DB_NAME,
  ensureTestDatabase,
} = require('./helpers/testDb');
const { seedTestDb } = require('./helpers/seed');

const PORT = Number(process.env.PW_TEST_PORT || 3100);
const BASE_PATH = process.env.BASE_PATH || '/fms-ovs';
const SERVER_STATE_FILE = path.join(os.tmpdir(), 'fms-e2e-server.json');
const HEALTH_URL = `http://localhost:${PORT}${BASE_PATH}/api/health`;
const READY_TIMEOUT_MS = 90_000;

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[e2e setup] ${msg}`);
}

function assertBuildPresent() {
  const buildId = path.join(process.cwd(), '.next', 'BUILD_ID');
  if (!fs.existsSync(buildId)) {
    throw new Error(
      '\n' +
      '──────────────────────────────────────────────────────────────────────\n' +
      '  e2e is BLOCKED: no production build found (.next/BUILD_ID missing).\n' +
      '\n' +
      '  The e2e suite runs against `next start` on :3100 (a PROD build), not\n' +
      '  the dev server. Build first, then run the suite:\n' +
      '\n' +
      '      npm run build            # stop the :3000 dev server first (Windows .next lock)\n' +
      '      npm run e2e              # or: npm run e2e:gate\n' +
      '\n' +
      '  (This is the R7 gate order: build → smoke → e2e. Fable runs the full\n' +
      '   cycle at the gate; a dev-only session cannot build.)\n' +
      '──────────────────────────────────────────────────────────────────────\n'
    );
  }
}

async function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = 'no attempt';
  while (Date.now() < deadline) {
    try {
      const r = await fetch(HEALTH_URL);
      if (r.ok) return true;
      lastErr = `status ${r.status}`;
    } catch (e) {
      lastErr = e?.message || String(e);
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error(`server on :${PORT} never became healthy (${HEALTH_URL}) — last: ${lastErr}`);
}

module.exports = async function globalSetup() {
  // 1. Build gate (fail-fast BEFORE any DB/server work).
  assertBuildPresent();

  if (!TEST_DB_URL || !TEST_DB_NAME) {
    throw new Error('DATABASE_URL missing — cannot derive the _e2e test DB');
  }
  log(`test DB = ${TEST_DB_NAME} (isolated from the dev DB)`);

  // 2. Create the test DB if needed.
  const { created } = await ensureTestDatabase();
  log(created ? `created database ${TEST_DB_NAME}` : `database ${TEST_DB_NAME} already exists`);

  // 3. Sync the CURRENT schema onto the test DB (db push mirrors how the dev DB
  //    itself was built; migration history is incomplete — see header note).
  log('prisma db push → test DB');
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'inherit',
  });

  // 4. Seed the small fixture.
  const seeded = await seedTestDb();
  log(`seeded: ${seeded.parties} parties, ${seeded.voters} voters, admin ${seeded.admin}`);

  // 5. Start the server under test (prod build, test DB).
  log(`starting: next start -p ${PORT} (NODE_ENV=development, DATABASE_URL → test DB)`);
  const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    env: {
      ...process.env,
      // NOTE: `next start` force-overrides NODE_ENV to "production" (proven in the
      // first gate run — sign-in bounced because the provider never registered).
      // The mock-login provider is instead enabled by the DUAL condition below:
      // E2E_MOCK_LOGIN flag + a DATABASE_URL whose db name ends with _e2e
      // (see src/lib/auth.js) — a real deployment can never satisfy both.
      E2E_MOCK_LOGIN: 'true',
      DATABASE_URL: TEST_DB_URL,
      PORT: String(PORT),
      NEXTAUTH_URL: `http://localhost:${PORT}${BASE_PATH}`,
      NEXT_PUBLIC_ENABLE_MOCK_LOGIN: 'true',
      BASE_PATH,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32', // resolve npx.cmd on Windows
    detached: process.platform !== 'win32',
  });

  fs.writeFileSync(
    SERVER_STATE_FILE,
    JSON.stringify({ pid: child.pid, port: PORT, startedAt: Date.now() }),
    'utf8'
  );
  log(`server pid ${child.pid} (state → ${SERVER_STATE_FILE})`);

  // 6. Wait until it answers /api/health.
  await waitForHealth(READY_TIMEOUT_MS);
  log(`server healthy on :${PORT}`);
};

module.exports.SERVER_STATE_FILE = SERVER_STATE_FILE;
module.exports.PORT = PORT;

// Standalone: `node e2e/global.setup.js` (npm run e2e:setup). Prints the
// fail-fast message + exits non-zero when there is no build.
if (require.main === module) {
  module.exports()
    .then(() => {
      log('setup complete (server left running — stop with global.teardown or kill the pid)');
      process.exit(0);
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e.message || e);
      process.exit(1);
    });
}
