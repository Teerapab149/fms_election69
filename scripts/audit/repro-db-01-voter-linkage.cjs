// scripts/audit/repro-db-01-voter-linkage.cjs
//
//   AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/repro-db-01-voter-linkage.cjs
//
// Claim under test (README): "no data in the system can say who chose what".
// 40 voters vote in a shuffled order through the app's own vote transaction.
// The script keeps the ground truth (who chose what) in memory only, then acts
// as someone who can READ the database and tries to rebuild it, five ways:
//
//   A  xmin join            User.xmin = Ballot.xmin        → voter ↔ ballot
//   B  Candidate.xmin       User.xmin = Candidate.xmin     → voter ↔ CHOICE, no key
//   C  physical row order   plain SELECT / COPY order      → voter ↔ ballot
//   D  hour bucket          only one vote in that hour     → voter ↔ ballot
//   E  two snapshots        who is new + which score grew  → voter ↔ CHOICE, no key
//
// then repeats A–C after the certification re-stamp (the same statements
// api/admin/dashboard runs) to see what certification removes.
const { db, reset, castVote, shuffle, loadState } = require("./lib/auditDb.cjs");
const { decryptBallot } = require("../../src/lib/ballotCrypto");
const { randomInt } = require("node:crypto");

const H = 3600_000;

async function measure(label, truth, state) {
  const c = db();
  const N = truth.size;
  const choiceOfSeq = new Map((await c.ballot.findMany()).map((b) => [b.seq, decryptBallot(b.payload, state.privateKey)]));

  // A — xmin join
  const a = await c.$queryRawUnsafe(`SELECT u.id, b.seq FROM "User" u JOIN "Ballot" b ON u.xmin = b.xmin WHERE u."isVoted"`);
  const aRight = a.filter((r) => truth.get(r.id).seq === r.seq).length;

  // B — Candidate.xmin: the row version of each candidate was written by the
  // transaction of the LAST vote for it; the voter's row carries the same xid.
  const b = await c.$queryRawUnsafe(`SELECT u.id, c.id AS cand FROM "User" u JOIN "Candidate" c ON u.xmin = c.xmin WHERE u."isVoted"`);
  const bRight = b.filter((r) => truth.get(r.id).cand === r.cand).length;

  // C — physical order. A SELECT with no ORDER BY on a small table is a
  // sequential scan in ctid order, which is also the order COPY (pg_dump)
  // writes rows in. Pair the k-th voted user in that order with ballot seq k.
  const phys = await c.$queryRawUnsafe(`SELECT id FROM "User" WHERE "isVoted" ORDER BY ctid`);
  let cRight = 0, d2 = 0;
  phys.forEach((r, i) => {
    if (truth.get(r.id).seq === i + 1) cRight++;
    d2 += (truth.get(r.id).seq - (i + 1)) ** 2;
  });
  const rho = N > 1 ? 1 - (6 * d2) / (N * (N * N - 1)) : 1;   // Spearman: 1 = physical order IS cast order

  console.log(`\n── ${label}`);
  console.log(`A xmin join User↔Ballot         : ${a.length} pairs returned, ${aRight}/${N} voters matched to their own ballot`);
  console.log(`B xmin join User↔Candidate      : ${b.length} voter(s) named WITH their choice, ${bRight} correct (no private key used)`);
  console.log(`C physical order (ctid / COPY)   : ${cRight}/${N} voters matched to their own ballot; rank correlation with cast order ${rho.toFixed(3)}`);
  return { aRight, bRight: b.length ? bRight : 0, bNamed: b.length, cRight };
}

(async () => {
  const state = loadState();
  const ROSTER = Number(process.env.AUDIT_ROSTER || 60), TURNOUT = Number(process.env.AUDIT_TURNOUT || 40);
  const { candidates, users } = await reset({ voters: ROSTER });
  const cands = candidates.map((c) => c.id);
  const voters = shuffle(users, 2026).slice(0, TURNOUT);   // a shuffled subset votes, in shuffled order
  const truth = new Map();                              // userId → { seq, cand }  (never stored in the DB)
  const c = db();

  // 38 votes in hour H0, then one lone vote in each of two later hours (D),
  // with a "backup snapshot" taken before and after the last one (E).
  const t0 = Date.UTC(2026, 1, 6, 2, 10);
  let snapBefore = null;
  for (let i = 0; i < voters.length; i++) {
    const cand = cands[(i * 7 + (i % 3)) % cands.length];
    const lone = voters.length - 2;                       // the last two vote alone, hours later
    const at = i < lone ? t0 + Math.floor(i * (50 * 60_000) / lone) : t0 + (i - lone + 2) * 5 * H;
    if (i === voters.length - 1) {
      snapBefore = { voted: new Set((await c.user.findMany({ where: { isVoted: true }, select: { id: true } })).map((u) => u.id)),
        score: new Map((await c.candidate.findMany()).map((x) => [x.id, x.score])) };
    }
    const r = await castVote(voters[i].id, cand, { at });
    if (r !== "OK") throw new Error("setup vote failed");
    truth.set(voters[i].id, { seq: i + 1, cand });
  }

  console.log(`setup: ${truth.size} of ${users.length} eligible voters voted; ground truth kept in memory only`);
  const before = await measure("BEFORE certification (the whole voting period, and until staff press รับรองผล)", truth, state);

  // D — hour buckets with exactly one voter
  const d = await c.$queryRawUnsafe(`
    SELECT u.id, b.seq FROM "User" u
    JOIN "Ballot" b ON b."hourBucket" = to_char(u."votedAt" + interval '7 hours' + interval '543 years', 'YYYY-MM-DD"T"HH24')
    WHERE u."isVoted" AND (SELECT count(*) FROM "Ballot" b2 WHERE b2."hourBucket" = b."hourBucket") = 1`);
  const dRight = d.filter((r) => truth.get(r.id).seq === r.seq).length;
  console.log(`D lone vote in an hour bucket    : ${d.length} voter(s) matched to a ballot by votedAt-hour = hourBucket alone, ${dRight} correct`);

  // E — two snapshots (two backups, or two looks at the tables)
  const votedNow = (await c.user.findMany({ where: { isVoted: true }, select: { id: true } })).map((u) => u.id);
  const newVoters = votedNow.filter((id) => !snapBefore.voted.has(id));
  const grew = (await c.candidate.findMany()).filter((x) => x.score > snapBefore.score.get(x.id));
  if (newVoters.length === 1 && grew.length === 1) {
    const ok = truth.get(newVoters[0]).cand === grew[0].id;
    console.log(`E two snapshots, one vote apart  : voter id ${newVoters[0]} chose "${grew[0].name}" — ${ok ? "CORRECT" : "wrong"} (no private key, no xmin; plain column values only)`);
  }

  // ── certification re-stamp, exactly as api/admin/dashboard does it ──
  await c.$transaction(async (tx) => {
    const ids = (await tx.$queryRaw`SELECT "id" FROM "User" WHERE "isVoted" = true`).map((r) => r.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = randomInt(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    for (const id of ids) await tx.$executeRaw`UPDATE "User" SET "votedAt" = "votedAt" WHERE "id" = ${id}`;
  }, { timeout: 120000 });
  const after = await measure("AFTER the certification re-stamp", truth, state);

  console.log("\nverdict");
  console.log(`  A  before ${before.aRight}/${truth.size} → after ${after.aRight}/${truth.size}`);
  console.log(`  B  before ${before.bNamed} named (${before.bRight} correct) → after ${after.bNamed}`);
  console.log(`  C  before ${before.cRight}/${truth.size} → after ${after.cRight}/${truth.size}`);
  await db().$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
