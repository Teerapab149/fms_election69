// scripts/decrypt-recount.js — OFFLINE dispute recount (key-holders only).
//
//   node scripts/decrypt-recount.js --key /path/to/election-private.pem
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
  const i = process.argv.indexOf("--key");
  if (i === -1 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

async function main() {
  const keyPath = keyPathFromArgs();
  if (!keyPath) {
    console.error("Usage: node scripts/decrypt-recount.js --key <path-to-private-key.pem>");
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
  const secret = process.env.BALLOT_CHAIN_SECRET;
  if (secret) {
    const v = await verifyChain(db, secret);
    console.log(`chain integrity: ${v.ok ? "✅ OK" : "❌ FAILED (recount below is untrustworthy)"}`);
  } else {
    console.log("chain integrity: (skipped — BALLOT_CHAIN_SECRET not set)");
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
