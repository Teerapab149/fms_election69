// scripts/audit/repro-01-verifier-blind-spots.cjs
//
//   node scripts/audit/repro-01-verifier-blind-spots.cjs
//
// No database needed. Runs the REAL src/lib/ballotChain.js + chainVerify.js +
// ballotCrypto.js against an in-memory store (lib/fakeDb.cjs) and asks, for
// each way of altering an election: does verifyChain() — the logic behind
// verify-ballot-chain.js, reconcile-scores.js, the readiness check and the
// certification step — notice?
//
// Each case prints who could do it and what the verifier said. Exit code 0
// always; read the table. "UNDETECTED" on a tamper case is a finding.
const { verifyChain } = require("../../src/lib/chainVerify");
const { chainHash, encryptBallot } = require("../../src/lib/ballotCrypto");
const { appendBallotTx } = require("../../src/lib/ballotChain");
const { makeDb, newKeys, castVote, recount } = require("./lib/fakeDb.cjs");

const CANDS = [
  { id: 1, number: 1, name: "พรรค A" },
  { id: 2, number: 2, name: "พรรค B" },
  { id: 3, number: 0, name: "งดออกเสียง" },
];
// honest election: 100 eligible, 60 vote → A 35, B 20, abstain 5
const PLAN = [...Array(35).fill(1), ...Array(20).fill(2), ...Array(5).fill(3)];

async function honest(keys) {
  const db = makeDb({ candidates: CANDS, voters: 100 });
  // deterministic interleave so the box is not sorted by candidate
  const order = PLAN.map((c, i) => ({ c, k: (i * 37) % PLAN.length })).sort((a, b) => a.k - b.k);
  for (let i = 0; i < order.length; i++) await castVote(db, keys, i + 1, order[i].c);
  return db;
}

const tally = (db) => db.s.candidates.map((c) => `${c.name}=${c.score}`).join(" ");
const rows = [];
async function check(label, who, db, keys, { expectDetected }) {
  const v = await verifyChain(db, keys.chainSecret);
  const rc = recount(db, keys.privateKey);
  const recountOk = db.s.candidates.every((c) => (rc.get(c.id) || 0) === c.score);
  const detected = !v.ok;
  rows.push({
    case: label,
    who,
    "verifyChain()": detected ? "DETECTED" : "passes",
    "decrypt-recount": recountOk ? "matches score" : "MISMATCH",
    announced: tally(db),
    verdict: expectDetected === detected ? (detected ? "ok (caught)" : "ok (honest)") : "FINDING: UNDETECTED",
    failing: v.checks.filter((c) => !c.ok).map((c) => c.name).join(",") || "-",
  });
}

(async () => {
  const keys = newKeys();

  // 0 — baseline
  let db = await honest(keys);
  await check("0 honest election", "-", db, keys, { expectDetected: false });

  // 1 — move 20 votes from A to B in Candidate.score. Winner flips A→B.
  db = await honest(keys);
  db.s.candidates[0].score -= 20;
  db.s.candidates[1].score += 20;
  await check("1 move 20 votes A→B in Candidate.score", "anyone with UPDATE on Candidate (the web app's own DB role has it)", db, keys, { expectDetected: true });

  // 2 — delete the LAST 10 ballots, point ChainHead at the new last row, take 10
  //     off party A, un-flag 10 voters. Needs no chain secret: every remaining
  //     row is still a valid link and the new head is a hash already in the table.
  db = await honest(keys);
  db.s.ballots.splice(-10);
  const last = db.s.ballots[db.s.ballots.length - 1];
  db.s.head = { id: 1, head: last.rowHash, seq: last.seq };
  db.s.candidates[0].score -= 10;
  db.s.users.filter((u) => u.isVoted).slice(-10).forEach((u) => { u.isVoted = false; });
  await check("2 delete last 10 ballots (tail truncation), no chain secret", "DB owner/superuser; also what restoring an older backup does", db, keys, { expectDetected: true });

  // 3 — stuff 15 ballots for B: encrypt with the PUBLIC key, chain with the
  //     server's chain secret (the real append code), flag 15 people who did not
  //     vote, bump B. Everything agrees, including the offline recount.
  db = await honest(keys);
  const idle = db.s.users.filter((u) => !u.isVoted).slice(0, 15);
  for (const u of idle) {
    u.isVoted = true;
    await appendBallotTx(db, { payload: encryptBallot(2, keys.publicKey), hourBucket: "2569-02-06T15", chainSecret: keys.chainSecret });
    db.s.candidates[1].score += 1;
  }
  await check("3 stuff 15 ballots for B on behalf of non-voters", "whoever controls the web process (.env has public key + chain secret; app role may INSERT Ballot, UPDATE User/Candidate)", db, keys, { expectDetected: true });

  // 4 — superuser + chain secret: replace ballot #5's payload with a vote for B
  //     and re-hash the chain from there to the tip.
  db = await honest(keys);
  {
    const bs = db.s.ballots;
    bs[4].payload = encryptBallot(2, keys.publicKey);
    let prev = bs[3].rowHash;
    for (let i = 4; i < bs.length; i++) {
      bs[i].prevHash = prev;
      bs[i].rowHash = chainHash(keys.chainSecret, prev, bs[i].payload, bs[i].seq);
      prev = bs[i].rowHash;
    }
    db.s.head.head = prev;
    // attacker cannot read ballot #5 without the private key, so the score
    // bookkeeping is a guess: take one from A, give one to B.
    db.s.candidates[0].score -= 1; db.s.candidates[1].score += 1;
  }
  await check("4 rewrite ballot #5 + re-hash whole chain", "DB superuser who also holds the chain secret (documented residual)", db, keys, { expectDetected: true });

  // ── cases the chain is supposed to catch, and does ─────────────────────────
  db = await honest(keys);
  db.s.ballots[9].payload = encryptBallot(2, keys.publicKey);
  await check("5 edit one ballot payload, no secret", "DB write, no chain secret", db, keys, { expectDetected: true });

  db = await honest(keys);
  db.s.ballots.splice(20, 1);
  db.s.candidates[0].score -= 1; db.s.users.find((u) => u.isVoted).isVoted = false;
  await check("6 delete a ballot from the middle", "DB write, no chain secret", db, keys, { expectDetected: true });

  db = await honest(keys);
  [db.s.ballots[7].payload, db.s.ballots[8].payload] = [db.s.ballots[8].payload, db.s.ballots[7].payload];
  await check("7 swap two ballots' payloads", "DB write, no chain secret", db, keys, { expectDetected: true });

  db = await honest(keys);
  {
    const a = db.s.ballots[7], b = db.s.ballots[8];
    [a.seq, b.seq] = [b.seq, a.seq];
  }
  await check("8 swap two ballots' seq (reorder)", "DB write, no chain secret", db, keys, { expectDetected: true });

  db = await honest(keys);
  {
    const fake = { seq: 61, payload: encryptBallot(2, keys.publicKey), hourBucket: null, prevHash: db.s.head.head, rowHash: "0".repeat(64) };
    db.s.ballots.push(fake); db.s.head = { id: 1, head: fake.rowHash, seq: 61 };
    db.s.candidates[1].score += 1; db.s.users.find((u) => !u.isVoted).isVoted = true;
  }
  await check("9 insert a ballot without the chain secret", "DB write, no chain secret", db, keys, { expectDetected: true });

  db = await honest(keys);
  db.s.head.head = "f".repeat(64);
  await check("10 overwrite ChainHead only", "app DB role (has UPDATE on ChainHead)", db, keys, { expectDetected: true });

  for (const r of rows) {
    console.log(`\n[${r.case}]`);
    console.log(`  who            : ${r.who}`);
    console.log(`  verifyChain()  : ${r["verifyChain()"]}${r.failing !== "-" ? `  (failed: ${r.failing})` : ""}`);
    console.log(`  decrypt-recount: ${r["decrypt-recount"]}`);
    console.log(`  tally shown    : ${r.announced}`);
    console.log(`  => ${r.verdict}`);
  }
  const findings = rows.filter((r) => r.verdict.startsWith("FINDING"));
  console.log(`\n${rows.length} cases, ${findings.length} tamper case(s) the routine verifier does not notice.`);
})();
