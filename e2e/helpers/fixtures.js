// @ts-check
// Shared E2E fixtures: Prisma-backed helpers bound to the ISOLATED test DB.
//
// v2-R11 (2026-07-18): the suite no longer touches the dev DB. Prisma here comes
// from testDb.testPrisma(), which is bound to `<devName>_e2e`, and every raw SQL
// mutation asserts current_database() ends with "_e2e" first. The server under
// test is `next start` on :3100 (prod build + test DB) — PW_BASE_URL default.
//
// CommonJS on purpose — playwright.config.js + the specs are all CJS (no ESM/jsx
// parsing here, per CLAUDE.md Rule 7). Node 18+ global fetch is used directly.
const fs = require('fs');
const path = require('path');
const {
  testPrisma,
  disconnect: dbDisconnect,
  assertTestDb,
  TEST_DB_URL,
} = require('./testDb');

const BASE_PATH = process.env.BASE_PATH || '/fms-ovs';
const SERVER = process.env.PW_BASE_URL || 'http://localhost:3100';
/** Absolute API URL for fixture-side fetches (the page uses its own baseURL). */
const API = (p) => `${SERVER}${BASE_PATH}${p}`;
/** Every minted test voter id starts with this so helpers can find/reverse them. */
const E2E_PREFIX = 'e2e-';

/** The test-DB Prisma client (bound to *_e2e — never the dev DB). */
function prisma() {
  return testPrisma();
}
async function disconnect() {
  await dbDisconnect();
}

/** Belt-and-suspenders guard for any RAW SQL mutation: ask Postgres for the LIVE
 *  database and refuse unless it ends with "_e2e". */
async function assertLiveTestDb() {
  const rows = await prisma().$queryRawUnsafe(`SELECT current_database() AS db`);
  assertTestDb(rows?.[0]?.db);
}

/** Unique, namespaced student id — an unknown id → mock-login mints a fresh,
 *  unvoted, year-"ปี 1" (eligible) user on first sign-in. */
function uniqueStudentId() {
  return `${E2E_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Resolve real ballot choices from the LIVE api so tests aren't pinned to seed
 *  ids. Returns the real parties + the abstain/disapprove special options. */
async function getBallot() {
  const r = await fetch(API('/api/results'));
  if (!r.ok) throw new Error(`GET /api/results → ${r.status}`);
  const j = await r.json();
  const realParties = (j.candidates || []).filter((c) => c.number > 0);
  const realParty = realParties[0];
  const abstain = (j.candidates || []).find((c) => c.number === 0);
  const disapprove = (j.candidates || []).find((c) => c.number === -1);
  if (!realParty) throw new Error('No real party on the ballot — seed one before running e2e');
  return { realParty, realParties, abstain, disapprove, candidates: j.candidates };
}

/** Live turnout count (valid-year voters), from the public results API. */
async function turnout() {
  const r = await fetch(API('/api/results'));
  if (!r.ok) throw new Error(`GET /api/results → ${r.status}`);
  return (await r.json()).totalVotes;
}

/** Snapshot systemMode, force MANUAL_OPEN (voting open regardless of the clock),
 *  return a restore fn. The seed already ships MANUAL_OPEN, but specs that flip
 *  the mode (closed.spec) use this to put it back. */
async function forceVotingOpen() {
  const db = prisma();
  const before = await db.systemConfig.findFirst({ where: { id: 1 } });
  const prevMode = before?.systemMode ?? 'MANUAL_OPEN';
  if (prevMode !== 'MANUAL_OPEN') {
    await db.systemConfig.update({ where: { id: 1 }, data: { systemMode: 'MANUAL_OPEN' } });
  }
  return async () => {
    await db.systemConfig.update({ where: { id: 1 }, data: { systemMode: prevMode } });
  };
}

/** Set systemMode to an arbitrary value (AUTO|MANUAL_OPEN|PAUSE|ENDED); returns a
 *  restore fn. Used by closed.spec (ENDED). */
async function setSystemMode(mode) {
  const db = prisma();
  const before = await db.systemConfig.findFirst({ where: { id: 1 } });
  const prev = before?.systemMode ?? 'MANUAL_OPEN';
  await db.systemConfig.update({ where: { id: 1 }, data: { systemMode: mode } });
  return async () => {
    await db.systemConfig.update({ where: { id: 1 }, data: { systemMode: prev } });
  };
}

/** Snapshot showResult, set it to `value`, return a restore fn. */
async function setShowResult(value) {
  const db = prisma();
  const before = await db.systemConfig.findFirst({ where: { id: 1 } });
  const prev = before?.showResult ?? false;
  await db.systemConfig.update({ where: { id: 1 }, data: { showResult: value } });
  return async () => {
    await db.systemConfig.update({ where: { id: 1 }, data: { showResult: prev } });
  };
}

/** Read a candidate's true score straight from the test DB (the public API masks
 *  it to 0 while results are hidden). */
async function candidateScore(id) {
  const c = await prisma().candidate.findUnique({ where: { id }, select: { score: true } });
  return c?.score ?? 0;
}

/** Reset a voter's turnout flag on the test DB via RAW SQL (spec: SQL between
 *  tests, guarded first). Lets a deterministic voter be re-used across tests. */
async function resetVoter(studentId) {
  await assertLiveTestDb();
  await prisma().$executeRawUnsafe(
    `UPDATE "User" SET "isVoted" = false, "votedAt" = NULL WHERE "studentId" = $1`,
    studentId
  );
}

/** Create an INELIGIBLE voter (year outside ปี 1-4) so the eligibility gate can
 *  be exercised — mock-login's fallback can only mint eligible "ปี 1" users. */
async function createIneligibleUser() {
  const studentId = `${E2E_PREFIX}inelig-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  await prisma().user.create({
    data: {
      studentId,
      name: 'E2E Ineligible',
      email: `${studentId}@mock.dev`,
      facultyId: '30',
      role: 'student',
      year: 'ปี 5', // not in the valid set → vote must be rejected 403
      isVoted: false,
      isFormCompleted: false,
      isAdmin: false,
    },
  });
  return studentId;
}

/** Ballot-box snapshot straight from the test DB: total ballots + ChainHead tip. */
async function ballotStats() {
  const db = prisma();
  const ballots = await db.ballot.count();
  const head = await db.chainHead.findUnique({ where: { id: 1 } });
  return { ballots, headSeq: head?.seq ?? 0, head: head?.head ?? 'GENESIS' };
}

/** Verify the whole HMAC ballot chain using the SAME logic as
 *  scripts/verify-ballot-chain.js (imported, not reimplemented). Reads
 *  BALLOT_CHAIN_SECRET from env/.env. Returns the verifyChain result. */
async function verifyBallotChain() {
  const { verifyChain } = require('../../scripts/lib/chainVerify');
  const env = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
  const secret = process.env.BALLOT_CHAIN_SECRET || env.BALLOT_CHAIN_SECRET;
  if (!secret) throw new Error('BALLOT_CHAIN_SECRET not in env/.env — cannot verify chain');
  return verifyChain(prisma(), secret);
}

/** Minimal .env reader (mirrors scripts/dev-admin-login.js) — keeps secrets OUT
 *  of the committed test, read from disk at runtime. */
function readEnvFile(file) {
  const out = {};
  try {
    const txt = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}

/** Log in as the seeded admin and return the `admin_token=<jwt>` cookie string.
 *  Secret comes from .env (never hardcoded). */
async function adminLogin() {
  const env = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
  const secret = process.env.ADMIN_PASSWORD_AUTH_EXTRA || env.ADMIN_PASSWORD_AUTH_EXTRA;
  if (!secret) throw new Error('ADMIN_PASSWORD_AUTH_EXTRA not in .env — cannot mint admin cookie');

  const admin = await prisma().user.findFirst({
    where: { isAdmin: true, email: { not: null } },
    select: { studentId: true, email: true },
  });
  if (!admin) throw new Error('no isAdmin user with an email in the test DB (seed it)');

  const email = String(admin.email).toLowerCase();
  const res = await fetch(API('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: admin.studentId || email, password: `${email}+${secret}` }),
  });
  if (res.status === 429) throw new Error('admin login rate-limited (429) — retry after the window');
  if (!res.ok) throw new Error(`admin login → ${res.status}`);
  const setCookie = res.headers.get('set-cookie') || '';
  const token = (setCookie.match(/admin_token=([^;]+)/) || [])[1];
  if (!token) throw new Error('admin login succeeded but no admin_token cookie returned');
  return `admin_token=${token}`;
}

/** Delete minted e2e-* voters (idempotent). The isolated DB is fully truncated in
 *  global.teardown; this is a light per-spec sweep so counts stay comprehensible
 *  across the sequential specs in one run. */
async function cleanupE2EUsers() {
  const db = prisma();
  const del = await db.user.deleteMany({ where: { studentId: { startsWith: E2E_PREFIX } } });
  return { deleted: del.count };
}

module.exports = {
  BASE_PATH,
  SERVER,
  API,
  E2E_PREFIX,
  TEST_DB_URL,
  prisma,
  disconnect,
  assertLiveTestDb,
  uniqueStudentId,
  getBallot,
  turnout,
  forceVotingOpen,
  setSystemMode,
  setShowResult,
  candidateScore,
  resetVoter,
  createIneligibleUser,
  ballotStats,
  verifyBallotChain,
  adminLogin,
  cleanupE2EUsers,
};
