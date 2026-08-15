// scripts/decrypt-recount.js — OFFLINE dispute recount (key-holders only).
//
//   node scripts/decrypt-recount.js --key /path/to/election-private.pem
//   node scripts/decrypt-recount.js /path/to/election-private.pem       (same thing)
//
// Reads the election PRIVATE key from a path OUTSIDE the repo, decrypts every
// Ballot.payload, and tallies per candidate — then compares that independent
// count to Candidate.score. This is the ONLY path that can read a ballot back,
// and by policy it runs only during a dispute, on a trusted offline machine,
// by whoever holds the split-custody private key. The server never has this key.
//
// The recount does NOT prove WHO voted for whom (ballots carry no userId) — it
// only re-derives the AGGREGATE per-candidate totals to confirm Candidate.score.

const { loadEnv } = require("./lib/loadEnv");
loadEnv();

const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { decryptBallot } = require("../src/lib/ballotCrypto");
const { verifyChain } = require("./lib/chainVerify");

const db = new PrismaClient();

function keyPathFromArgs() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--key");
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  // A bare path works too. The key ceremony output told key-holders to type it
  // that way for a while, and a dispute recount is the worst possible moment to
  // lose time to a missing flag.
  return argv.find((a) => !a.startsWith("-")) || null;
}

async function main() {
  const keyPath = keyPathFromArgs();
  if (!keyPath) {
    console.error("Usage: node scripts/decrypt-recount.js --key <path-to-private-key.pem>");
    console.error("   or: node scripts/decrypt-recount.js <path-to-private-key.pem>");
    process.exitCode = 1;
    return;
  }
  let privateKeyPem;
  try {
    privateKeyPem = fs.readFileSync(keyPath, "utf8");
  } catch (e) {
    console.error(`Cannot read private key at ${keyPath}: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // Verify chain integrity first — a recount over a tampered box is meaningless.
  //
  // verifyChain() returns one combined `ok` over four checks, but only two of
  // them answer "was a ballot altered?". The other two compare counts, and those
  // drift for ordinary reasons — a user row edited after the box closed, say.
  // Reporting a single verdict meant a clean recount got stamped "untrustworthy"
  // over bookkeeping, and printing one line meant nobody could tell which. This
  // is read during a dispute, so it names the failing check.
  const TAMPER_CHECKS = ["chain-integrity", "head-matches"];
  const secret = process.env.BALLOT_CHAIN_SECRET;
  if (secret) {
    const v = await verifyChain(db, secret);
    const tamper = v.checks.filter((c) => TAMPER_CHECKS.includes(c.name));
    const books = v.checks.filter((c) => !TAMPER_CHECKS.includes(c.name));

    const intact = tamper.every((c) => c.ok);
    console.log(intact
      ? "chain integrity: ✅ OK — no ballot was added, removed or altered"
      : "chain integrity: ❌ FAILED — the ballot box was altered; the recount below cannot be trusted");
    for (const c of tamper) console.log(`   ${c.ok ? "✅" : "❌"} ${c.name.padEnd(16)} ${c.detail}`);

    if (!books.every((c) => c.ok)) {
      console.log(intact
        ? "bookkeeping:     ⚠️  counts disagree — the chain itself is intact, so the recount stands,\n                     but reconcile these before certifying:"
        : "bookkeeping:     ⚠️  counts also disagree (expected once the box has been altered):");
      for (const c of books) console.log(`   ${c.ok ? "✅" : "⚠️ "} ${c.name.padEnd(16)} ${c.detail}`);
    }
    console.log("");
  } else {
    console.log("chain integrity: (skipped — BALLOT_CHAIN_SECRET not set)\n");
  }

  const ballots = await db.ballot.findMany({ orderBy: { seq: "asc" } });
  const candidates = await db.candidate.findMany({
    select: { id: true, name: true, number: true, score: true },
    orderBy: { number: "asc" },
  });
  const byId = new Map(candidates.map((c) => [c.id, c]));

  const recount = new Map();
  let undecryptable = 0;
  for (const b of ballots) {
    try {
      const cid = decryptBallot(b.payload, privateKeyPem);
      recount.set(cid, (recount.get(cid) || 0) + 1);
    } catch {
      undecryptable++;
    }
  }

  console.log("\nnumber | name | score(column) | recount(decrypted) | status");
  let drift = 0;
  for (const c of candidates) {
    const r = recount.get(c.id) || 0;
    const bad = r !== c.score;
    if (bad) drift++;
    console.log(`${String(c.number).padStart(6)} | ${c.name} | ${c.score} | ${r} | ${bad ? "DRIFT" : "ok"}`);
  }
  // ballots decrypting to an unknown/removed candidate id
  for (const [cid, n] of recount) {
    if (!byId.has(cid)) {
      drift++;
      console.log(`     ? | (unknown candidateId ${cid}) | — | ${n} | DRIFT`);
    }
  }
  if (undecryptable > 0) console.warn(`\n⚠️ ${undecryptable} ballot(s) failed to decrypt (wrong key or corrupt payload).`);

  console.log(
    drift === 0 && undecryptable === 0
      ? "\n✅ recount matches Candidate.score exactly."
      : `\n❌ ${drift} candidate(s) drifted${undecryptable ? ` + ${undecryptable} undecryptable` : ""}.`
  );
  if (drift > 0 || undecryptable > 0) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
