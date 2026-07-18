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
 * a timestamp cannot be correlated back to a voter. The voter's precise time
 * lives on User.votedAt (their own, non-secret data).
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
 * @param {*} tx        a Prisma transaction client
 * @param {{payload:string, hourBucket:(string|null), chainSecret:string}} args
 * @returns {Promise<{seq:number, rowHash:string, prevHash:string}>}
 */
async function appendBallotTx(tx, { payload, hourBucket, chainSecret }) {
  const rows = await tx.$queryRaw`
    SELECT "head", "seq" FROM "ChainHead" WHERE "id" = 1 FOR UPDATE
  `;
  if (!rows || rows.length === 0) {
    throw new Error("ChainHead row missing — cannot append ballot (run the v2-SEC migration/seed)");
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

module.exports = { appendBallotTx, hourBucketBangkok };
