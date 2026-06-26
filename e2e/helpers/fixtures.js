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

/** Reverse every e2e mutation: decrement the score each e2e ballot added, then
 *  delete the e2e users. Idempotent + also sweeps leftovers from a crashed run. */
async function cleanupE2EUsers() {
  const db = prisma();
  const voters = await db.user.findMany({
    where: { studentId: { startsWith: E2E_PREFIX }, isVoted: true, candidateId: { not: null } },
    select: { candidateId: true },
  });
  const byCandidate = {};
  for (const v of voters) byCandidate[v.candidateId] = (byCandidate[v.candidateId] || 0) + 1;
  for (const [cid, n] of Object.entries(byCandidate)) {
    await db.candidate
      .update({ where: { id: Number(cid) }, data: { score: { decrement: n } } })
      .catch(() => {}); // candidate may have been deleted between runs — ignore
  }
  const del = await db.user.deleteMany({ where: { studentId: { startsWith: E2E_PREFIX } } });
  return { deleted: del.count, scoreReversed: byCandidate };
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
  cleanupE2EUsers,
};
