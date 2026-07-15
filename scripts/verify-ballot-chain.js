// scripts/verify-ballot-chain.js — tamper-evidence audit for the ballot box.
//
//   node scripts/verify-ballot-chain.js
//
// Recomputes the whole HMAC chain (GENESIS → head), cross-checks the stored
// ChainHead, and reconciles ballot count against sum(Candidate.score) and the
// isVoted turnout flag. Prints PASS/FAIL per check. Exit code 0 = all pass,
// non-zero = something drifted or was tampered — investigate before trusting
// the result. Run it as part of certification, BEFORE flipping showResult on.
//
// Requires BALLOT_CHAIN_SECRET (server secret) in env / .env.

const { loadEnv } = require("./lib/loadEnv");
loadEnv();

const { PrismaClient } = require("@prisma/client");
const { verifyChain } = require("./lib/chainVerify");

const db = new PrismaClient();

async function main() {
  const secret = process.env.BALLOT_CHAIN_SECRET;
  if (!secret) {
    console.error("REFUSED: BALLOT_CHAIN_SECRET not set — cannot verify the chain.");
    process.exitCode = 1;
    return;
  }

  const { checks, ok, counts } = await verifyChain(db, secret);

  console.log("Ballot chain verification");
  console.log("─────────────────────────");
  for (const c of checks) {
    console.log(`${c.ok ? "✅ PASS" : "❌ FAIL"}  ${c.name.padEnd(16)} ${c.detail}`);
  }
  console.log("─────────────────────────");
  console.log(`ballots=${counts.ballots}  sum(score)=${counts.scoreSum}  voted(ปี1-4)=${counts.voted}`);
  console.log(ok ? "\n✅ CHAIN OK — no tampering or drift detected." : "\n❌ VERIFICATION FAILED — see the FAIL line(s) above.");

  if (!ok) process.exitCode = 2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
