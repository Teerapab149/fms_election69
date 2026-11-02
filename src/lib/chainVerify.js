// src/lib/chainVerify.js, the ONE source of truth for the ballot-chain audit.
//
// Used by the certification step (api/admin/dashboard, inside its transaction)
// and by the command-line tools through scripts/lib/chainVerify.js
// (verify-ballot-chain.js, reconcile-scores.js, decrypt-recount.js). "Does the
// chain hold?" and "does score match the box?" are therefore answered by
// identical logic everywhere. CommonJS so Next (import) and node (require) both
// load it. Pure over its inputs: the caller supplies a Prisma client or an open
// transaction client, and the chain secret (BALLOT_CHAIN_SECRET).

const { chainHash } = require("./ballotCrypto");

/**
 * Recompute the whole chain and cross-check the tallies.
 *
 * The turnout figure counts every User flagged isVoted, with no filter on year.
 * /api/vote already refuses anyone outside ปี 1 to ปี 4, so the filter never
 * removed a legitimate voter, but it did turn a roster import that changed a
 * voter's year into a false FAIL (ballots 12, voted 11).
 *
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {string} secret  BALLOT_CHAIN_SECRET
 * @returns {Promise<{
 *   checks: {name:string, ok:boolean, detail:string}[],
 *   ok: boolean,
 *   counts: {ballots:number, scoreSum:number, voted:number},
 *   firstBreak: ({seq:number, why:string}|null),
 *   head: {head:string, seq:number}
 * }>}
 */
async function verifyChain(db, secret) {
  if (!secret) throw new Error("BALLOT_CHAIN_SECRET not set, cannot verify chain");

  const ballots = await db.ballot.findMany({ orderBy: { seq: "asc" } });
  const headRow = await db.chainHead.findUnique({ where: { id: 1 } });
  const candidates = await db.candidate.findMany({ select: { score: true } });
  const scoreSum = candidates.reduce((a, c) => a + (c.score || 0), 0);
  const voted = await db.user.count({ where: { isVoted: true } });

  const checks = [];

  // 1) Chain recompute: contiguity + prevHash link + rowHash MAC, row by row.
  let prev = "GENESIS";
  let expectedSeq = 1;
  let chainOk = true;
  let firstBreak = null;
  for (const b of ballots) {
    if (b.seq !== expectedSeq) {
      chainOk = false;
      firstBreak = firstBreak ?? { seq: b.seq, why: `gap/disorder: expected seq ${expectedSeq}, got ${b.seq}` };
      // keep expectedSeq following the actual row so we can still recompute the rest
    }
    if (b.prevHash !== prev) {
      chainOk = false;
      firstBreak = firstBreak ?? { seq: b.seq, why: `prevHash mismatch (chain broken at or before seq ${b.seq})` };
    }
    const expect = chainHash(secret, b.prevHash, b.payload, b.seq);
    if (b.rowHash !== expect) {
      chainOk = false;
      firstBreak = firstBreak ?? { seq: b.seq, why: `rowHash mismatch at seq ${b.seq} (row tampered: payload/seq/prevHash altered)` };
    }
    prev = b.rowHash;
    expectedSeq = b.seq + 1;
  }
  checks.push({
    name: "chain-integrity",
    ok: chainOk,
    detail: chainOk
      ? `all ${ballots.length} ballot(s) recompute cleanly (GENESIS to head)`
      : `BROKEN at seq ${firstBreak?.seq}: ${firstBreak?.why}`,
  });

  // 2) Head match: the recomputed tip must equal the stored ChainHead.
  const lastHash = ballots.length ? ballots[ballots.length - 1].rowHash : "GENESIS";
  const lastSeq = ballots.length ? ballots[ballots.length - 1].seq : 0;
  const headOk = !!headRow && headRow.head === lastHash && headRow.seq === lastSeq;
  checks.push({
    name: "head-matches",
    ok: headOk,
    detail: headOk
      ? `ChainHead {seq:${headRow.seq}} matches last ballot`
      : `ChainHead {head:${headRow?.head?.slice(0, 12)}..., seq:${headRow?.seq}} != last ballot {hash:${lastHash.slice(0, 12)}..., seq:${lastSeq}}`,
  });

  // 3) Ballots == sum(score): every cast ballot incremented exactly one score.
  const ballotsMatchScore = ballots.length === scoreSum;
  checks.push({
    name: "ballots==score",
    ok: ballotsMatchScore,
    detail: `${ballots.length} ballot(s) vs sum(Candidate.score)=${scoreSum}` + (ballotsMatchScore ? "" : "  DRIFT"),
  });

  // 4) Ballots == voted users: the turnout flag agrees with the box.
  const ballotsMatchVoted = ballots.length === voted;
  checks.push({
    name: "ballots==voted",
    ok: ballotsMatchVoted,
    detail: `${ballots.length} ballot(s) vs ${voted} user(s) isVoted` + (ballotsMatchVoted ? "" : "  DRIFT"),
  });

  return {
    checks,
    ok: checks.every((c) => c.ok),
    counts: { ballots: ballots.length, scoreSum, voted },
    firstBreak,
    // the recomputed tip, not the stored one: this is what a certified record pins
    head: { head: lastHash, seq: lastSeq },
  };
}

module.exports = { verifyChain };
