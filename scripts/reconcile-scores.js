// Reconcile Candidate.score against the actual ballot box (v2-SEC).
//
//   node scripts/reconcile-scores.js          # report drift, change nothing
//
// v2-SEC changed what "the ballots" are. Ballots are now anonymous + encrypted
// (no User.candidateId link), so this script can no longer recount PER CANDIDATE
// from plaintext — that is only possible offline, with the private key, via
// scripts/decrypt-recount.js. What it CAN (and must) still audit before results
// are published:
//   • the HMAC chain is intact (no ballot was silently edited/removed), and
//   • the aggregate invariants hold: #ballots == sum(score) == #isVoted(ปี1-4).
// This is the same logic scripts/verify-ballot-chain.js runs — shared in
// scripts/lib/chainVerify.js so the two never drift apart.
//
// There is no --fix here anymore: score is maintained atomically at vote time
// and the ballot box is append-only, so a mismatch is a real incident to
// investigate (a code path that touched one side only), not something to
// paper over by overwriting score. Run this as part of certification, BEFORE
// flipping showResult on (runbook §5.1).

const { loadEnv } = require("./lib/loadEnv");
loadEnv();

const { PrismaClient } = require("@prisma/client");
const { verifyChain } = require("./lib/chainVerify");

const db = new PrismaClient();

async function main() {
  const secret = process.env.BALLOT_CHAIN_SECRET;
  if (!secret) {
    console.error("REFUSED: BALLOT_CHAIN_SECRET not set — cannot audit the ballot chain.");
    process.exitCode = 1;
    return;
  }

  const cfg = await db.systemConfig.findFirst({ where: { id: 1 } });
  if (cfg?.globalConfig?.ballotsAnonymized === true) {
    console.log("NOTE: results are certified (ballotsAnonymized flag set) — the frozen Candidate.score is the record. Running a read-only audit anyway:\n");
  }

  const { checks, ok, counts } = await verifyChain(db, secret);

  for (const c of checks) {
    console.log(`${c.ok ? "✅ PASS" : "❌ FAIL"}  ${c.name.padEnd(16)} ${c.detail}`);
  }
  console.log(`\nballots=${counts.ballots}  sum(score)=${counts.scoreSum}  voted(ปี1-4)=${counts.voted}`);
  console.log(
    ok
      ? "\n✅ reconciled — chain intact and score matches the ballot box."
      : "\n❌ mismatch — investigate BEFORE publishing results. For a per-candidate recount use scripts/decrypt-recount.js (offline, private key)."
  );
  if (!ok) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
