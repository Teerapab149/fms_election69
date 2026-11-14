// @ts-check
// Certification record and the ballot-box lock, on the ISOLATED test DB + prod
// build (see playwright.config.js). Four things the unit tests cannot show:
//
//   1. an independent recount: every ballot in the box is decrypted with the
//      suite's own throwaway election key (global.setup.js) and the totals are
//      compared with Candidate.score and with the numbers pinned at certification
//   2. ballots queued at the ChainHead lock when the box is closed are ALL
//      refused (code ENDED), none half-recorded: ballots, score and isVoted agree
//   3. the box closing while votes stream in: each request ends recorded in full
//      or refused in full, never in between
//   4. certification queued BEHIND votes that are waiting at the lock: the votes
//      are refused, and the pinned numbers equal the box as it ended
//
// Specs run alphabetically on one worker and the box is shared, so every test
// ends by putting the election back to "open, nothing published, nothing
// certified" (resetElection), the state the specs after this one expect.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { test, expect } = require('@playwright/test');
const { E2E_ADMIN_PASSWORD, ADMIN_STUDENT_ID } = require('./helpers/seed');
const { assertTestDb, dbNameOf } = require('./helpers/testDb');
const {
  API,
  TEST_DB_URL,
  E2E_BALLOT_KEY_FILE,
  prisma,
  assertLiveTestDb,
  getBallot,
  ballotStats,
  verifyBallotChain,
  mintSession,
  castWith,
  disconnect,
} = require('./helpers/fixtures');
const { decryptBallot } = require('../src/lib/ballotCrypto');

const RUN = `${Date.now()}`;
const STAFF_ID = `e2e-staff-cert-${RUN}`;
const STAFF_NAME = 'อีทูอี เจ้าหน้าที่ตรวจบัตร';

let xffSeq = 0;
const nextXff = () => `203.0.113.${(Number(RUN.slice(-2)) + ++xffSeq) % 250 + 1}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** @type {string} */ let committeeCookie = '';
/** @type {string} */ let staffCookie = '';

async function apiLogin(username, password) {
  const res = await fetch(API('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': nextXff() },
    body: JSON.stringify({ username, password }),
  });
  const token = ((res.headers.get('set-cookie') || '').match(/admin_token=([^;]+)/) || [])[1];
  return { status: res.status, cookie: token ? `admin_token=${token}` : '' };
}

async function dashboard(cookie, body) {
  const res = await fetch(API('/api/admin/dashboard'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Open box, nothing published, nothing certified (guarded raw SQL, *_e2e only). */
async function resetElection() {
  await assertLiveTestDb();
  await prisma().$executeRawUnsafe(
    `UPDATE "SystemConfig"
        SET "showResult" = false,
            "globalConfig" = CASE WHEN "globalConfig" IS NULL THEN NULL
              ELSE "globalConfig" - 'ballotsAnonymized' - 'certifiedAt' - 'certifiedBy' - 'certifiedByUsername'
                                  - 'certifiedTally' - 'certifiedBallots' - 'certifiedChainHead' - 'resultsRevealedAt' END
      WHERE id = 1`
  );
  const r = await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'MANUAL_OPEN' });
  if (r.status !== 200) throw new Error(`reset SET_MODE got ${r.status} ${JSON.stringify(r.body)}`);
}

/** Close the box and publish, as the committee does (ADMIN-GUIDE section 5). */
async function closeAndPublish() {
  expect((await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'ENDED' })).status).toBe(200);
  expect((await dashboard(committeeCookie, { action: 'SET_SHOW_RESULT', value: true })).status).toBe(200);
}

const privateKey = () => fs.readFileSync(E2E_BALLOT_KEY_FILE, 'utf8');

/** Decrypt every ballot with the suite's key. Returns Map<candidateId, count>. */
async function recountBox() {
  const ballots = await prisma().ballot.findMany({ orderBy: { seq: 'asc' } });
  const key = privateKey();
  const counts = new Map();
  for (const b of ballots) {
    const id = decryptBallot(b.payload, key);
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return { counts, ballots };
}

/** { ballots, scoreSum, voted } straight from the DB. */
async function box() {
  const db = prisma();
  const [ballots, agg, voted] = await Promise.all([
    db.ballot.count(),
    db.candidate.aggregate({ _sum: { score: true } }),
    db.user.count({ where: { isVoted: true } }),
  ]);
  return { ballots, scoreSum: agg._sum.score || 0, voted };
}

async function mintMany(n, tag) {
  const ids = Array.from({ length: n }, (_, i) => `e2e-cert-${RUN}-${tag}-${i}`);
  const out = new Array(n);
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < n) { const k = next++; out[k] = { studentId: ids[k], cookie: await mintSession(ids[k]) }; }
  }));
  return out;
}

async function lockWaiters() {
  const rows = await prisma().$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`
  );
  return rows[0].n;
}
async function waitForLockWaiters(n, ms = 15000) {
  const end = Date.now() + ms;
  let seen = 0;
  while (Date.now() < end) {
    seen = await lockWaiters();
    if (seen >= n) return seen;
    await sleep(100);
  }
  throw new Error(`only ${seen} connection(s) waiting on a lock, expected ${n}`);
}

/** Hold the ChainHead row lock (what /api/vote and certification queue on). */
function holdChainLock() {
  let release = () => {};
  const gate = new Promise((r) => { release = r; });
  let locked = () => {};
  const ready = new Promise((r) => { locked = r; });
  const done = prisma().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "ChainHead" WHERE "id" = 1 FOR UPDATE`;
    locked();
    await gate;
  }, { timeout: 60000, maxWait: 15000 });
  return { ready, release: async () => { release(); await done; } };
}

test.describe('Certification record and ballot-box lock (isolated test DB)', () => {
  test.skip(!fs.existsSync(E2E_BALLOT_KEY_FILE), 'the throwaway election key is missing: this server was not started by global.setup.js');

  test.beforeAll(async () => {
    await assertLiveTestDb();
    await prisma().user.deleteMany({ where: { studentId: { startsWith: 'e2e-staff-cert-' } } });
    const login = await apiLogin(ADMIN_STUDENT_ID, E2E_ADMIN_PASSWORD);
    if (login.status !== 200) throw new Error(`committee API login got ${login.status}`);
    committeeCookie = login.cookie;

    // the real IT command, pointed at the test DB only
    assertTestDb(dbNameOf(TEST_DB_URL));
    const out = execFileSync(
      process.execPath,
      [path.join('scripts', 'admin.js'), '--create-staff', STAFF_ID, '--name', STAFF_NAME],
      { env: { ...process.env, DATABASE_URL: TEST_DB_URL }, encoding: 'utf8', cwd: process.cwd() }
    );
    const password = (out.match(/^\s+Password\s+(\S+)\s*$/m) || [])[1] || '';
    const staff = await apiLogin(STAFF_ID, password);
    if (staff.status !== 200) throw new Error(`staff API login got ${staff.status}`);
    staffCookie = staff.cookie;
    await resetElection();
  });

  test.afterAll(async () => {
    try {
      await resetElection();
    } finally {
      await prisma().user.deleteMany({ where: { studentId: { startsWith: 'e2e-staff-cert-' } } });
      await disconnect();
    }
  });

  test('1. decrypting the whole box gives the tally the DB, the certification record and the recount tool all agree on', async () => {
    test.setTimeout(120_000);
    await resetElection();
    const { realParties, abstain } = await getBallot();
    const choices = [realParties[0], realParties[0], realParties[1], abstain, realParties[0], realParties[1]];
    const voters = await mintMany(choices.length, 'recount');
    for (let i = 0; i < voters.length; i += 1) {
      const r = await castWith(voters[i].cookie, choices[i].id);
      expect(r.status, `cast ${i}: ${r.text}`).toBe(200);
    }

    // the recount: decrypt everything with the suite's key
    const { counts, ballots } = await recountBox();
    const candidates = await prisma().candidate.findMany({ select: { id: true, number: true, name: true, score: true } });
    const known = new Set(candidates.map((c) => c.id));
    for (const id of counts.keys()) expect(known.has(id), `ballot decrypts to unknown candidate ${id}`).toBe(true);
    for (const c of candidates) expect(counts.get(c.id) || 0, `recount for ${c.name}`).toBe(c.score);
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(ballots.length);
    console.log(`[recount] ${ballots.length} ballots decrypted, per option: ${candidates.map((c) => `${c.number}=${counts.get(c.id) || 0}`).join(' ')}`);

    // close, publish, certify as the staff account
    await closeAndPublish();
    const cert = await dashboard(staffCookie, { action: 'ANONYMIZE_BALLOTS' });
    expect(cert.status, JSON.stringify(cert.body)).toBe(200);
    const gc = /** @type {any} */ ((await prisma().systemConfig.findUnique({ where: { id: 1 } }))?.globalConfig);
    expect(gc.ballotsAnonymized).toBe(true);

    // the pinned tally equals the decrypted one, option by option
    for (const row of gc.certifiedTally) {
      const c = candidates.find((x) => x.number === row.number);
      expect(row.score, `certified score for number ${row.number}`).toBe(counts.get(c.id) || 0);
    }
    expect(gc.certifiedTally).toHaveLength(candidates.length);
    expect(gc.certifiedBallots).toBe(ballots.length);
    expect(gc.certifiedChainHead).toBe(ballots[ballots.length - 1].rowHash);
    expect(gc.certifiedChainHead).toBe((await ballotStats()).head);
    expect(cert.body.certifiedChainHead).toBe(gc.certifiedChainHead);

    // the repository's own recount tool, key from file, agrees (exit 0)
    const out = execFileSync(
      process.execPath,
      [path.join('scripts', 'decrypt-recount.js'), '--key', E2E_BALLOT_KEY_FILE],
      { env: { ...process.env, DATABASE_URL: TEST_DB_URL }, encoding: 'utf8', cwd: process.cwd() }
    );
    expect(out).toContain('recount matches Candidate.score exactly');

    // nothing enters after the record: a fresh voter is refused and the box is unchanged
    const late = (await mintMany(1, 'late'))[0];
    const refused = await castWith(late.cookie, realParties[0].id);
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('CERTIFIED');
    expect((await ballotStats()).ballots).toBe(gc.certifiedBallots);
    await resetElection();
  });

  test('2. ballots queued at the lock when the box is closed are all refused, none half-recorded', async () => {
    test.setTimeout(120_000);
    await resetElection();
    const { realParties } = await getBallot();
    const before = await box();
    const voters = await mintMany(10, 'queue');

    // three votes go through normally while the box is open
    for (const v of voters.slice(0, 3)) {
      const r = await castWith(v.cookie, realParties[0].id);
      expect(r.status, r.text).toBe(200);
    }

    // seven more are sent while the test holds the ChainHead lock: each passes the
    // open-box check, claims its voter row, then waits for the lock
    const lock = holdChainLock();
    await lock.ready;
    const queued = voters.slice(3).map((v, i) => castWith(v.cookie, realParties[i % 2].id));
    const waiting = await waitForLockWaiters(7);
    console.log(`[queue] ${waiting} votes waiting at the ChainHead lock`);

    // the committee closes the box (SystemConfig lock only, so it is not blocked)
    expect((await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'ENDED' })).status).toBe(200);
    await lock.release();

    const results = await Promise.all(queued);
    for (const r of results) {
      expect(r.status, r.text).toBe(403);
      expect(r.body.code).toBe('ENDED');
      expect(r.body.error).toBe('ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม');
    }

    const after = await box();
    expect(after.ballots - before.ballots).toBe(3);
    expect(after.scoreSum - before.scoreSum).toBe(3);
    expect(after.voted - before.voted).toBe(3);
    // the seven refused voters are still able to vote (their claim was rolled back)
    const refusedUsers = await prisma().user.findMany({ where: { studentId: { in: voters.slice(3).map((v) => v.studentId) } }, select: { isVoted: true, votedAt: true } });
    expect(refusedUsers).toHaveLength(7);
    for (const u of refusedUsers) { expect(u.isVoted).toBe(false); expect(u.votedAt).toBeNull(); }
    const chain = await verifyBallotChain();
    expect(chain.ok, JSON.stringify(chain.checks)).toBe(true);
    await resetElection();
  });

  test('3. the box closing while votes stream in: every request ends recorded in full or refused in full', async () => {
    test.setTimeout(180_000);
    await resetElection();
    const { realParties, abstain } = await getBallot();
    const before = await box();
    const N = 120;
    const voters = await mintMany(N, 'stream');

    const sent = voters.map((v, i) => castWith(v.cookie, [realParties[0], realParties[1], abstain][i % 3].id));
    // close as soon as the first ballots are in, while the rest are still in flight
    const closeAt = Date.now() + 10000;
    while ((await box()).ballots - before.ballots < 8 && Date.now() < closeAt) await sleep(15);
    const closed = await dashboard(committeeCookie, { action: 'SET_MODE', mode: 'ENDED' });
    expect(closed.status).toBe(200);

    const results = await Promise.all(sent);
    const accepted = results.filter((r) => r.status === 200);
    const refused = results.filter((r) => r.status !== 200);
    console.log(`[stream] ${N} votes sent, ${accepted.length} recorded, ${refused.length} refused`);
    for (const r of refused) {
      expect(r.status, r.text).toBe(403);
      expect(r.body.code, r.text).toBe('ENDED');
    }
    expect(accepted.length).toBeGreaterThan(0);

    const after = await box();
    expect(after.ballots - before.ballots).toBe(accepted.length);
    expect(after.scoreSum - before.scoreSum).toBe(accepted.length);
    expect(after.voted - before.voted).toBe(accepted.length);
    // per voter: isVoted exactly when the response was 200
    const rows = await prisma().user.findMany({ where: { studentId: { in: voters.map((v) => v.studentId) } }, select: { studentId: true, isVoted: true } });
    const votedBy = new Map(rows.map((u) => [u.studentId, u.isVoted]));
    voters.forEach((v, i) => expect(votedBy.get(v.studentId), `${i}: ${results[i].status}`).toBe(results[i].status === 200));
    const chain = await verifyBallotChain();
    expect(chain.ok, JSON.stringify(chain.checks)).toBe(true);
    // and the independent recount of what is in the box equals Candidate.score
    const { counts } = await recountBox();
    for (const c of await prisma().candidate.findMany()) expect(counts.get(c.id) || 0).toBe(c.score);
    await resetElection();
  });

  test('4. certification queued behind waiting votes: the votes are refused and the record equals the box as it ended', async () => {
    test.setTimeout(120_000);
    await resetElection();
    const { realParties } = await getBallot();
    const voters = await mintMany(9, 'cert');

    for (const v of voters.slice(0, 2)) {
      const r = await castWith(v.cookie, realParties[1].id);
      expect(r.status, r.text).toBe(200);
    }
    const lock = holdChainLock();
    await lock.ready;
    const queuedVotes = voters.slice(2).map((v) => castWith(v.cookie, realParties[0].id));
    await waitForLockWaiters(7);

    // close and publish while those seven wait, then start certifying: it queues
    // for the same lock, behind them
    await closeAndPublish();
    const certification = dashboard(staffCookie, { action: 'ANONYMIZE_BALLOTS' });
    await waitForLockWaiters(8);
    await lock.release();

    const votes = await Promise.all(queuedVotes);
    for (const r of votes) {
      expect(r.status, r.text).toBe(403);
      expect(['ENDED', 'CERTIFIED']).toContain(r.body.code);
    }
    const cert = await certification;
    expect(cert.status, JSON.stringify(cert.body)).toBe(200);

    const gc = /** @type {any} */ ((await prisma().systemConfig.findUnique({ where: { id: 1 } }))?.globalConfig);
    const live = await ballotStats();
    expect(live.ballots).toBe(gc.certifiedBallots);
    expect(live.head).toBe(gc.certifiedChainHead);
    expect(gc.certifiedTally.reduce((a, r) => a + r.score, 0)).toBe(live.ballots);
    expect((await box()).voted).toBe(live.ballots);
    expect((await verifyBallotChain()).ok).toBe(true);
    // the seven waiting voters were never recorded
    const never = await prisma().user.count({ where: { studentId: { in: voters.slice(2).map((v) => v.studentId) }, isVoted: true } });
    expect(never).toBe(0);
    await resetElection();
  });

  test('5. a settings save racing the certification is not lost, and the form link column survives', async () => {
    test.setTimeout(120_000);
    await resetElection();
    const { realParties } = await getBallot();
    const [v] = await mintMany(1, 'race');
    expect((await castWith(v.cookie, realParties[0].id)).status).toBe(200);
    const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSe2eRaceTest/viewform';
    const orig = (await prisma().systemConfig.findUnique({ where: { id: 1 } }))?.googleFormUrl ?? null;
    await prisma().systemConfig.update({ where: { id: 1 }, data: { googleFormUrl: FORM } });
    try {
      await closeAndPublish();
      // the settings form and the staff certification fire at the same instant
      const put = fetch(API('/api/admin/global-config'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', cookie: committeeCookie },
        body: JSON.stringify({ globalConfig: { e2eRace: RUN } }),
      });
      const [cert, saved] = await Promise.all([dashboard(staffCookie, { action: 'ANONYMIZE_BALLOTS' }), put]);
      expect(cert.status, JSON.stringify(cert.body)).toBe(200);
      expect(saved.status).toBe(200);
      const row = await prisma().systemConfig.findUnique({ where: { id: 1 } });
      const gc = /** @type {any} */ (row?.globalConfig);
      expect(gc.ballotsAnonymized).toBe(true);
      expect(gc.certifiedTally).toBeTruthy();
      expect(gc.e2eRace).toBe(RUN);
      expect(row?.googleFormUrl).toBe(FORM);
    } finally {
      await prisma().systemConfig.update({ where: { id: 1 }, data: { googleFormUrl: orig } });
      await resetElection();
      await prisma().$executeRawUnsafe(`UPDATE "SystemConfig" SET "globalConfig" = "globalConfig" - 'e2eRace' WHERE id = 1`);
    }
  });
});
