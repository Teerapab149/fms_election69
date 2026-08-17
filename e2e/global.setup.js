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
const net = require('net');
const { spawn, execSync } = require('child_process');
const {
  TEST_DB_URL,
  TEST_DB_NAME,
  ensureTestDatabase,
} = require('./helpers/testDb');
const { seedTestDb } = require('./helpers/seed');

const PORT = Number(process.env.PW_TEST_PORT || 3100);
const BASE_PATH = process.env.BASE_PATH || '';
const SERVER_STATE_FILE = path.join(os.tmpdir(), 'fms-e2e-server.json');
const HEALTH_URL = `http://localhost:${PORT}${BASE_PATH}/api/health`;
const READY_TIMEOUT_MS = 90_000;

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[e2e setup] ${msg}`);
}

// Guard against the false-positive gate: if something is ALREADY listening on
// PORT before we spawn anything, a later fetch to HEALTH_URL can succeed
// against that foreign server (e.g. a stale dev server or a leftover run from
// another worktree/port) instead of the server this run builds+seeds. That
// makes the suite report green while testing the wrong app/DB/build — this
// happened for real and cost a long debugging session before the cause was
// understood (see ticket E2E-GUARD). A raw TCP connect is used instead of an
// HTTP probe so it doesn't matter whether the foreign process even speaks
// this app's routes — anything answering on the port is disqualifying.
function isPortOccupied(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (occupied) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(occupied);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false)); // ECONNREFUSED etc → nothing listening
    socket.connect(port, host);
  });
}

async function assertPortFree(port) {
  const occupied = await isPortOccupied(port);
  if (!occupied) return;
  throw new Error(
    '\n' +
    '──────────────────────────────────────────────────────────────────────\n' +
    `  e2e is BLOCKED: port ${port} is already in use by another process.\n` +
    '\n' +
    '  global.setup.js refuses to spawn the test server on an occupied port.\n' +
    '  Probing a health endpoint on a port something else already holds can\n' +
    '  succeed against that FOREIGN server (a stale dev server, a leftover\n' +
    '  run on another worktree, etc.) instead of the build+DB this run just\n' +
    '  prepared — the suite would then report green while testing the wrong\n' +
    '  app. This exact failure mode happened once already and cost a long\n' +
    '  debugging session before it was understood.\n' +
    '\n' +
    '  Fix: pick a free port and set PW_TEST_PORT (and matching PW_BASE_URL\n' +
    '  when running tests), e.g.:\n' +
    '\n' +
    '      PW_TEST_PORT=3800 npm run e2e:setup\n' +
    '      PW_TEST_PORT=3800 PW_BASE_URL=http://localhost:3800 npm run e2e:gate\n' +
    '──────────────────────────────────────────────────────────────────────\n'
  );
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

// `child` is the process THIS run spawned. We already proved (assertPortFree,
// called before spawn) that nothing was listening on PORT beforehand, so a
// health success here is trustworthy ONLY as long as our own child is still
// alive to have produced it. If the child has already exited but something
// still answers on PORT, that is not us — it is a new arrival that raced in
// after our pre-flight check (or a symptom of a broken spawn) — fail loudly
// instead of accepting the response as proof of our own server's health.
async function waitForHealth(timeoutMs, child) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = 'no attempt';
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `the spawned server (pid ${child.pid}) exited early ` +
        `(code ${child.exitCode}, signal ${child.signalCode}) before answering ` +
        `${HEALTH_URL} — see the inherited stdio output above for the real error. ` +
        `Refusing to keep polling: any later response on :${PORT} would not be from this process.`
      );
    }
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

  // 1b. Port gate (fail-fast BEFORE any DB/server work) — see assertPortFree
  // for why this must run before we ever spawn+probe.
  await assertPortFree(PORT);
  log(`port :${PORT} is free`);

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
      // Both halves of the pair, always in lockstep: BASE_PATH drives next.config's
      // own basePath, NEXT_PUBLIC_BASE_PATH drives getPath() in client code. Passing
      // only the first used to work by accident, because getPath defaulted to the
      // same hardcoded '/fms-ovs'. It no longer does, so a subpath e2e run
      // (BASE_PATH=/fms-ovs npm run e2e) needs this to stay honest.
      BASE_PATH,
      NEXT_PUBLIC_BASE_PATH: BASE_PATH,
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

  // 6. Wait until it answers /api/health (and confirm it's still OUR child).
  await waitForHealth(READY_TIMEOUT_MS, child);
  log(`server healthy on :${PORT} (pid ${child.pid})`);
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
