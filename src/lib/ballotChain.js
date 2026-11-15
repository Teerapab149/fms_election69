// src/lib/ballotChain.js — the ONE place a ballot is appended to the chain.
//
// Shared by the vote route (Next, `import`) and prisma/seed.js (node, `require`)
// so a seeded ballot is chained EXACTLY like a real one — otherwise reconcile /
// verify would diverge between seed data and production data.
//
// CommonJS so both worlds can load it. `encryptBallot`/`chainHash` come from
// ballotCrypto (also CJS, node:crypto only).

const { chainHash } = require("./ballotCrypto");

/**
 * Coarse hour bucket in Thai Buddhist-era local time, e.g. "2569-02-06T09".
 * This is the ONLY time a Ballot carries — deliberately blunt so insert order +
 * a timestamp cannot be correlated back to a voter. User.votedAt is floored to
 * the SAME hour (hourFloor below), so neither table holds a finer time.
 * @param {number} nowMs
 * @returns {string}
 */
function hourBucketBangkok(nowMs) {
  const bkk = new Date(nowMs + 7 * 60 * 60 * 1000); // UTC+7, no DST
  const be = bkk.getUTCFullYear() + 543;
  const mm = String(bkk.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(bkk.getUTCDate()).padStart(2, "0");
  const hh = String(bkk.getUTCHours()).padStart(2, "0");
  return `${be}-${mm}-${dd}T${hh}`;
}

/**
 * The hour a vote falls in, as a Date on the hour: what User.votedAt stores.
 *
 * Why not the exact time: Ballot.seq is cast order and votedAt used to be exact
 * to the millisecond, so ORDER BY votedAt reproduced seq order for every voter
 * (measured 2026-10-03: 4 of 4 voters lined up with their ballot; see
 * .specs/H3-ballot-linkability-2026-10-03.md). Flooring to the hour matches
 * Ballot.hourBucket, so the voter's row says no more than the ballot's row does.
 * Bangkok is UTC+7 (whole hours, no DST), so flooring in UTC lands on the same
 * instant as flooring in Bangkok.
 * @param {number} nowMs
 * @returns {Date}
 */
function hourFloor(nowMs) {
  return new Date(Math.floor(nowMs / 3600000) * 3600000);
}

/**
 * Append one already-encrypted ballot to the chain INSIDE the caller's
 * transaction. The caller owns the surrounding `db.$transaction(...)`: the
 * `SELECT ... FOR UPDATE` here takes the ChainHead row lock, which SERIALIZES
 * concurrent appenders so every ballot gets the true previous rowHash as its
 * prevHash (gap-free, verifiable chain even under simultaneous votes).
 *
 * Encryption is done by the CALLER, before the transaction, so the row lock is
 * held for the shortest possible time (the ciphertext never depends on chain
 * state — only on the choice + a fresh nonce).
 *
 * `recheck` (optional) runs once the row lock is held and before anything is
 * written. The caller read the election's state BEFORE it waited for the lock,
 * and certification or closing the box can commit in that wait; a lock holder
 * sees every commit made before it got the lock, so this is the first moment
 * the state can be trusted. It returns null to go on, or any truthy reason to
 * stop: nothing is written and `{ refused: reason }` comes back, and the caller
 * is expected to roll its transaction back (by throwing) so that whatever it
 * wrote earlier, such as the voter's isVoted flag, is undone as well.
 *
 * @param {*} tx        a Prisma transaction client
 * @param {{payload:string, hourBucket:(string|null), chainSecret:string,
 *          recheck?:((tx:*) => Promise<*>)}} args
 * @returns {Promise<{seq:number, rowHash:string, prevHash:string} | {refused:*}>}
 */
async function appendBallotTx(tx, { payload, hourBucket, chainSecret, recheck }) {
  const rows = await tx.$queryRaw`
    SELECT "head", "seq" FROM "ChainHead" WHERE "id" = 1 FOR UPDATE
  `;
  if (!rows || rows.length === 0) {
    throw new Error("ไม่พบแถว ChainHead จึงเพิ่มบัตรไม่ได้ (รัน migration หรือ seed ของ v2-SEC)");
  }
  if (recheck) {
    const refused = await recheck(tx);
    if (refused) return { refused };
  }
  const prevHash = rows[0].head;
  const nextSeq = Number(rows[0].seq) + 1;
  const rowHash = chainHash(chainSecret, prevHash, payload, nextSeq);

  await tx.ballot.create({
    data: { seq: nextSeq, payload, hourBucket, prevHash, rowHash },
  });
  await tx.chainHead.update({
    where: { id: 1 },
    data: { head: rowHash, seq: nextSeq },
  });

  return { seq: nextSeq, rowHash, prevHash };
}

/**
 * Add one vote to the tally INSIDE the caller's transaction (the same one that
 * claimed the voter's isVoted flag and appended the ballot).
 *
 * Every Candidate row is written, not only the chosen one. PostgreSQL stamps
 * each row it writes with the writing transaction's id (`xmin`), and the voter's
 * User row carries the same id. Writing only the chosen row meant that
 * `User.xmin = Candidate.xmin` named the last voter of every candidate together
 * with their choice, without any key (SECURITY-AUDIT F5, line B: 3 of 3 right).
 * With every row written, every candidate carries the latest voter's id, which
 * says nothing about whom they chose.
 *
 * Call it after appendBallotTx: votes queue on the ChainHead row lock first, so
 * two votes never hold Candidate row locks in different orders.
 *
 * Throws (rolling the caller's transaction back) unless exactly one row is the
 * chosen candidate, so a ballot can never be appended without its tally.
 *
 * @param {*} tx            a Prisma transaction client
 * @param {number} candidateId
 */
async function tallyVoteTx(tx, candidateId) {
  const rows = await tx.$queryRaw`
    UPDATE "Candidate"
       SET "score" = "score" + CASE WHEN "id" = ${candidateId} THEN 1 ELSE 0 END
     RETURNING ("id" = ${candidateId}) AS "chosen"
  `;
  const chosen = rows.filter((r) => r.chosen === true).length;
  if (chosen !== 1) {
    throw new Error(`นับคะแนนไม่สำเร็จ: พบพรรคที่เลือก ${chosen} แถว (ต้องเป็น 1)`);
  }
}

module.exports = { appendBallotTx, tallyVoteTx, hourBucketBangkok, hourFloor };
