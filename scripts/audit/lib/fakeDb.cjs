// scripts/audit/lib/fakeDb.cjs — an in-memory stand-in for the four Prisma
// calls that src/lib/ballotChain.js (appendBallotTx) and src/lib/chainVerify.js
// (verifyChain) make. It lets the audit run the REAL append + verify code with
// no database, so the question "what does the verifier actually check?" can be
// answered on any machine. It models nothing about Postgres itself (locks,
// xmin, physical order) — those are covered by the repro-db-*.cjs scripts.
const crypto = require("node:crypto");
const { encryptBallot, decryptBallot } = require("../../../src/lib/ballotCrypto");
const { appendBallotTx } = require("../../../src/lib/ballotChain");

function makeDb({ candidates, voters }) {
  const s = {
    ballots: [],
    head: { id: 1, head: "GENESIS", seq: 0 },
    candidates: candidates.map((c) => ({ score: 0, ...c })),
    users: Array.from({ length: voters }, (_, i) => ({ id: i + 1, isVoted: false })),
  };
  const db = {
    s,
    // appendBallotTx: SELECT head, seq FROM ChainHead ... FOR UPDATE
    $queryRaw: async () => [{ head: s.head.head, seq: s.head.seq }],
    ballot: {
      create: async ({ data }) => { s.ballots.push({ ...data }); },
      findMany: async () => [...s.ballots].sort((a, b) => a.seq - b.seq),
      count: async () => s.ballots.length,
    },
    chainHead: {
      update: async ({ data }) => { Object.assign(s.head, data); },
      findUnique: async () => ({ ...s.head }),
    },
    candidate: { findMany: async () => s.candidates.map((c) => ({ ...c })) },
    user: { count: async () => s.users.filter((u) => u.isVoted).length },
  };
  return db;
}

function newKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey, chainSecret: crypto.randomBytes(32).toString("hex") };
}

// One honest vote, the same three writes /api/vote makes in its transaction.
async function castVote(db, keys, userId, candidateId) {
  const u = db.s.users.find((x) => x.id === userId);
  if (u.isVoted) throw new Error("already voted");
  u.isVoted = true;
  await appendBallotTx(db, {
    payload: encryptBallot(candidateId, keys.publicKey),
    hourBucket: "2569-02-06T09",
    chainSecret: keys.chainSecret,
  });
  db.s.candidates.find((c) => c.id === candidateId).score += 1;
}

// What scripts/decrypt-recount.js computes: per-candidate count from the box.
function recount(db, privateKey) {
  const out = new Map();
  for (const b of db.s.ballots) {
    const c = decryptBallot(b.payload, privateKey);
    out.set(c, (out.get(c) || 0) + 1);
  }
  return out;
}

module.exports = { makeDb, newKeys, castVote, recount };
