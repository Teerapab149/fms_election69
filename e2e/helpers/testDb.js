// @ts-check
// e2e/helpers/testDb.js — isolated test-DB derivation + the destructive-SQL GUARD.
//
// v2-R11: the e2e suite runs against a SEPARATE database `<devName>_e2e`, NEVER
// the dev DB (`fms_election`) the owner watches on :3000. Everything that
// connects a Prisma client, and every destructive statement (TRUNCATE), routes
// through here so the guard is UNAVOIDABLE:
//
//   assertTestDb(name)  throws unless `name` ends with "_e2e"
//   truncateAll(prisma) asks Postgres for current_database() and asserts THAT
//                       (the live connection, not a derived string) before it
//                       truncates — so a mis-wired DATABASE_URL cannot wipe dev.
//
// CommonJS on purpose — playwright.config.js + the specs + global setup/teardown
// are all CJS (no ESM/jsx parsing here, per CLAUDE.md Rule 7).
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const E2E_SUFFIX = '_e2e';
/** Test DB names must be a plain identifier ending in _e2e (raw-SQL safety). */
const SAFE_TEST_DB = /^[A-Za-z0-9_]+_e2e$/;

/** Minimal .env reader (mirrors scripts/lib/loadEnv.js) — no dotenv dependency. */
function readEnvFile(file) {
  const out = {};
  try {
    const txt = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}

/** The dev DATABASE_URL (real env wins, then .env/.env.local). */
function baseDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in env or .env — cannot derive the _e2e test DB');
  }
  return env.DATABASE_URL;
}

/** The database name inside a postgres URL (e.g. "fms_election"). */
function dbNameOf(url) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\//, '')).split('?')[0];
}

/** Given the dev URL, return { devName, testName }. Idempotent: if the base URL
 *  already points at an *_e2e DB, that name is reused verbatim. */
function deriveNames(baseUrl) {
  const devName = dbNameOf(baseUrl);
  if (!devName) throw new Error(`DATABASE_URL has no database name: ${baseUrl}`);
  const testName = devName.endsWith(E2E_SUFFIX) ? devName : `${devName}${E2E_SUFFIX}`;
  return { devName, testName };
}

/** The connection string pointing at the *_e2e test DB (schema param preserved). */
function testDatabaseUrl() {
  const base = baseDatabaseUrl();
  const { testName } = deriveNames(base);
  const u = new URL(base);
  u.pathname = `/${testName}`;
  return u.toString();
}

/** A maintenance connection to the built-in `postgres` DB — used only to
 *  CREATE DATABASE (which cannot run while connected to the target DB). */
function adminDatabaseUrl() {
  const u = new URL(baseDatabaseUrl());
  u.pathname = '/postgres';
  u.search = ''; // drop ?schema=public for the maintenance connection
  return u.toString();
}

const TEST_DB_URL = (() => {
  try { return testDatabaseUrl(); } catch { return null; }
})();
const TEST_DB_NAME = (() => {
  try { return deriveNames(baseDatabaseUrl()).testName; } catch { return null; }
})();

// ── THE GUARD ────────────────────────────────────────────────────────────────
// The single hard stop that protects the dev DB. Called before every TRUNCATE
// and before CREATE DATABASE. Pasting this verbatim in the R11 report.
function assertTestDb(dbName) {
  if (typeof dbName !== 'string' || !dbName.endsWith(E2E_SUFFIX)) {
    throw new Error(
      `[e2e GUARD] REFUSED: destructive SQL requested on database "${dbName}" — ` +
      `only a database whose name ends with "${E2E_SUFFIX}" may be created or truncated. ` +
      `This is the hard stop that protects the dev DB (fms_election). ` +
      `Check DATABASE_URL / your test wiring before retrying.`
    );
  }
}

let _prisma = null;
/** Lazy Prisma client BOUND to the *_e2e test DB — never the dev DB. Every
 *  fixture/spec uses this, so no test code can accidentally open the dev DB. */
function testPrisma() {
  if (!TEST_DB_URL) throw new Error('TEST_DB_URL unavailable — DATABASE_URL missing');
  if (!_prisma) {
    _prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
  }
  return _prisma;
}

async function disconnect() {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

/** Create `<devName>_e2e` if it does not exist (TEMPLATE template0). Guarded +
 *  identifier-validated so it can never touch anything but an *_e2e database. */
async function ensureTestDatabase() {
  const base = baseDatabaseUrl();
  const { testName } = deriveNames(base);
  assertTestDb(testName);
  if (!SAFE_TEST_DB.test(testName)) {
    throw new Error(`[e2e GUARD] unsafe test DB identifier "${testName}" — refusing to CREATE`);
  }
  const admin = new PrismaClient({ datasources: { db: { url: adminDatabaseUrl() } } });
  try {
    const rows = await admin.$queryRawUnsafe(
      `SELECT 1 AS ok FROM pg_database WHERE datname = '${testName}'`
    );
    if (!rows.length) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${testName}" TEMPLATE template0`);
      return { testName, created: true };
    }
    return { testName, created: false };
  } finally {
    await admin.$disconnect();
  }
}

/** TRUNCATE every table in the test DB (teardown keeps the DB, empties it).
 *  The guard here asks Postgres for the LIVE connected database — the strongest
 *  possible check — and refuses unless it ends with "_e2e". */
async function truncateAll(prisma) {
  const rows = await prisma.$queryRawUnsafe(`SELECT current_database() AS db`);
  const live = rows?.[0]?.db;
  assertTestDb(live); // ← guards on the ACTUAL connection, not a derived string
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "AdminAuditLog","Ballot","Member","User","Candidate","SystemConfig","Template" RESTART IDENTITY CASCADE;`
  );
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ChainHead" RESTART IDENTITY CASCADE;`);
}

module.exports = {
  E2E_SUFFIX,
  TEST_DB_URL,
  TEST_DB_NAME,
  baseDatabaseUrl,
  testDatabaseUrl,
  adminDatabaseUrl,
  deriveNames,
  dbNameOf,
  assertTestDb,
  testPrisma,
  disconnect,
  ensureTestDatabase,
  truncateAll,
};
