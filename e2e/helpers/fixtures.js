// @ts-check
// Shared E2E fixtures: Prisma-backed setup/teardown + live-API helpers.
//
// Design (confirmed with owner, 2026-06-26):
//   - MINT-FRESH voters: every run signs in brand-new `e2e-*` student ids via the
//     mock-login provider, which upserts an eligible (year "ปี 1") DB user. So the
//     suite needs no RESET_VOTES and never reuses seed voters.
//   - FULL TEARDOWN: cleanupE2EUsers() reverses *both* mutations a vote makes —
//     it decrements each candidate's `score` by the number of e2e ballots before
//     deleting the users, so the score==ballots invariant (results/route.js,
//     reconcile-scores.js) stays intact. Leaving score inflated would make the
//     reconcile audit (runbook §5.1) report false drift.
//
// CommonJS on purpose — playwright.config.js + the specs are all CJS (no ESM/jsx
// parsing here, per CLAUDE.md Rule 7). Node 18+ global fetch is used directly.
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const BASE_PATH = '/fms-ovs';
const SERVER = process.env.PW_BASE_URL || 'http://localhost:3000';
/** Absolute API URL for fixture-side fetches (the page uses its own baseURL). */
const API = (p) => `${SERVER}${BASE_PATH}${p}`;
/** Every test voter id starts with this so teardown can find + reverse them. */
const E2E_PREFIX = 'e2e-';

let _prisma = null;
function prisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}
async function disconnect() {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null; // allow a later lazy re-create in the same process
  }
}

/** Unique, namespaced student id — an unknown id → mock-login mints a fresh,
 *  unvoted, year-"ปี 1" (eligible) user on first sign-in. */
function uniqueStudentId() {
  return `${E2E_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Resolve real ballot choices from the LIVE api so tests aren't pinned to seed
 *  ids (id 1/2/8 today, different next year). */
async function getBallot() {
  const r = await fetch(API('/api/results'));
  if (!r.ok) throw new Error(`GET /api/results → ${r.status}`);
  const j = await r.json();
  const realParty = (j.candidates || []).find((c) => c.number > 0);
  const abstain = (j.candidates || []).find((c) => c.number === 0);
  if (!realParty) throw new Error('No real party on the ballot — seed one before running e2e');
  return { realParty, abstain, candidates: j.candidates };
}

/** Live turnout count (valid-year voters). Masked to 0 before polls open, so the
 *  caller must run with voting open (see forceVotingOpen). */
async function turnout() {
  const r = await fetch(API('/api/results'));
  if (!r.ok) throw new Error(`GET /api/results → ${r.status}`);
  return (await r.json()).totalVotes;
}

/** Snapshot systemMode, force MANUAL_OPEN (voting open regardless of the clock),
 *  return a restore fn. Keeps the suite from depending on whatever state the
 *  owner left the dev DB in. */
async function forceVotingOpen() {
  const db = prisma();
  const before = await db.systemConfig.findFirst({ where: { id: 1 } });
  const prevMode = before?.systemMode ?? 'AUTO';
  if (prevMode !== 'MANUAL_OPEN') {
    await db.systemConfig.update({ where: { id: 1 }, data: { systemMode: 'MANUAL_OPEN' } });
  }
  return async () => {
    await db.systemConfig.update({ where: { id: 1 }, data: { systemMode: prevMode } });
  };
}

/** Snapshot showResult, set it to `value`, return a restore fn. Used by the
 *  ballot-secrecy invariant (toggle the reveal, then put it back). */
async function setShowResult(value) {
  const db = prisma();
  const before = await db.systemConfig.findFirst({ where: { id: 1 } });
  const prev = before?.showResult ?? false;
  await db.systemConfig.update({ where: { id: 1 }, data: { showResult: value } });
  return async () => {
    await db.systemConfig.update({ where: { id: 1 }, data: { showResult: prev } });
  };
}

/** Read a candidate's true score straight from the DB (the public API masks it
 *  to 0 while results are hidden, so the race test can't trust HTTP for this). */
async function candidateScore(id) {
  const c = await prisma().candidate.findUnique({ where: { id }, select: { score: true } });
  return c?.score ?? 0;
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

/** Minimal .env reader (mirrors scripts/dev-admin-login.js) — keeps the admin
 *  bootstrap secret OUT of the committed test, read from disk at runtime. */
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

/** Log in as a real admin and return the `admin_token=<jwt>` cookie string for
 *  same-origin API calls. Secret comes from .env (never hardcoded). One call =
 *  one login attempt — run e2e BEFORE smoke so the login rate-limiter (10/5min)
 *  isn't already tripped by smoke's burst test. */
async function adminLogin() {
  const env = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
  const secret = env.ADMIN_PASSWORD_AUTH_EXTRA;
  if (!secret) throw new Error('ADMIN_PASSWORD_AUTH_EXTRA not in .env — cannot mint admin cookie');

  const admin = await prisma().user.findFirst({
    where: { isAdmin: true, email: { not: null } },
    select: { studentId: true, email: true },
  });
  if (!admin) throw new Error('no isAdmin user with an email in the DB');

  const email = String(admin.email).toLowerCase();
  const res = await fetch(API('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: admin.studentId || email, password: `${email}+${secret}` }),
  });
  if (res.status === 429) throw new Error('admin login rate-limited (429) — run e2e before smoke, or wait 5 min');
  if (!res.ok) throw new Error(`admin login → ${res.status}`);
  const setCookie = res.headers.get('set-cookie') || '';
  const token = (setCookie.match(/admin_token=([^;]+)/) || [])[1];
  if (!token) throw new Error('admin login succeeded but no admin_token cookie returned');
  return `admin_token=${token}`;
}

/** Delete the e2e users. Idempotent + sweeps leftovers from a crashed run.
 *
 *  ⚠️ v2-SEC CHANGE (flagged for owner): ballots are now anonymous + append-only
 *  (no User.candidateId link, and the app role cannot DELETE from "Ballot"), so
 *  this can no longer reverse the per-candidate score by walking each e2e user's
 *  ballot. An e2e vote leaves behind: +1 chained Ballot and +1 Candidate.score
 *  that this teardown does NOT undo — so after a run #ballots/#score stay in sync
 *  with each other but exceed #isVoted once the e2e users are deleted (the
 *  reconcile "#ballots==#voted" check would report drift). The right long-term
 *  fix is a suite-level snapshot/restore of "Ballot" + "ChainHead" + scores (or a
 *  disposable test DB); until the owner picks one, prefer re-seeding the dev DB
 *  after an e2e run rather than trusting reconcile on it. */
async function cleanupE2EUsers() {
  const db = prisma();
  const del = await db.user.deleteMany({ where: { studentId: { startsWith: E2E_PREFIX } } });
  return { deleted: del.count, scoreReversed: null };
}

module.exports = {
  BASE_PATH,
  SERVER,
  API,
  E2E_PREFIX,
  prisma,
  disconnect,
  uniqueStudentId,
  getBallot,
  turnout,
  forceVotingOpen,
  setShowResult,
  candidateScore,
  createIneligibleUser,
  adminLogin,
  cleanupE2EUsers,
};
