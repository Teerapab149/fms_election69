// scripts/audit/lib/auditDb.cjs — the audit's own throwaway database.
//
// Every DB-backed repro script goes through here. Two hard stops, so nothing
// in scripts/audit can ever touch a real or a dev database:
//   1. AUDIT_DATABASE_URL must be set explicitly (DATABASE_URL / .env are never
//      read), its host must be local, and its database name must end in _e2e
//      or _test.
//   2. before the first destructive statement the LIVE connection is asked for
//      current_database() and inet_server_addr(), and both are checked again.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { encryptBallot } = require("../../../src/lib/ballotCrypto");
const { appendBallotTx, hourBucketBangkok, hourFloor } = require("../../../src/lib/ballotChain");

const STATE_FILE = path.join(__dirname, "..", ".audit-state.local"); // *.local is gitignored
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function auditUrl() {
  const url = process.env.AUDIT_DATABASE_URL;
  if (!url) throw new Error("[audit GUARD] set AUDIT_DATABASE_URL to a LOCAL throwaway database (name ending _e2e or _test). DATABASE_URL is never used.");
  const u = new URL(url);
  const name = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!LOCAL_HOSTS.has(u.hostname)) throw new Error(`[audit GUARD] REFUSED: host "${u.hostname}" is not local`);
  if (!/^[A-Za-z0-9_]+_(e2e|test)$/.test(name)) throw new Error(`[audit GUARD] REFUSED: database "${name}" does not end in _e2e or _test`);
  return url;
}

let _db = null;
function db() {
  if (!_db) _db = new PrismaClient({ datasources: { db: { url: auditUrl() } } });
  return _db;
}

async function assertLive(client) {
  const [r] = await client.$queryRawUnsafe(`SELECT current_database() AS db, COALESCE(host(inet_server_addr()), 'local') AS addr`);
  if (!/_(e2e|test)$/.test(r.db)) throw new Error(`[audit GUARD] REFUSED: connected to "${r.db}"`);
  if (!["127.0.0.1", "::1", "local"].includes(r.addr)) throw new Error(`[audit GUARD] REFUSED: server address ${r.addr} is not local`);
  return r;
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const st = { publicKey, privateKey, chainSecret: crypto.randomBytes(32).toString("hex") };
  fs.writeFileSync(STATE_FILE, JSON.stringify(st), { mode: 0o600 });
  return st;
}

const YEARS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

/** Wipe and seed: `voters` eligible students, parties A/B + abstain, box open. */
async function reset({ voters = 40 } = {}) {
  const c = db();
  await assertLive(c);
  await c.$executeRawUnsafe(`TRUNCATE TABLE "AdminAuditLog","Ballot","Member","User","Candidate","SystemConfig","Template" RESTART IDENTITY CASCADE`);
  await c.$executeRawUnsafe(`TRUNCATE TABLE "ChainHead" RESTART IDENTITY CASCADE`);
  await c.chainHead.create({ data: { id: 1, head: "GENESIS", seq: 0 } });
  await c.systemConfig.create({ data: { id: 1, systemMode: "MANUAL_OPEN", showResult: false, activeTemplateId: "receipt" } });
  await c.candidate.createMany({ data: [
    { name: "AUDIT พรรค A", number: 1 }, { name: "AUDIT พรรค B", number: 2 }, { name: "งดออกเสียง", number: 0 },
  ] });
  await c.user.createMany({ data: Array.from({ length: voters }, (_, i) => ({
    studentId: `audit-${String(i + 1).padStart(4, "0")}`, name: `ผู้มีสิทธิ์ ${i + 1}`, role: "student",
    year: YEARS[i % 4], major: ["ACC", "MKT", "BIS"][i % 3], gender: i % 2 ? "F" : "M",
  })) });
  return { candidates: await c.candidate.findMany({ orderBy: { number: "asc" } }), users: await c.user.findMany({ orderBy: { id: "asc" } }) };
}

/**
 * The vote transaction, statement for statement what src/app/api/vote/route.js
 * runs (claim → append → tally), using the app's own appendBallotTx/encryptBallot.
 * Returns "OK" | "ALREADY_VOTED". The HTTP checks around it are exercised
 * separately by repro-http-*.mjs against the real route.
 */
async function castVote(userId, candidateId, { at = Date.now(), client = db(), state = loadState() } = {}) {
  const payload = encryptBallot(candidateId, state.publicKey);
  return client.$transaction(async (tx) => {
    const claim = await tx.user.updateMany({ where: { id: userId, isVoted: false }, data: { isVoted: true, votedAt: hourFloor(at) } });
    if (claim.count === 0) return "ALREADY_VOTED";
    await appendBallotTx(tx, { payload, hourBucket: hourBucketBangkok(at), chainSecret: state.chainSecret });
    await tx.candidate.update({ where: { id: candidateId }, data: { score: { increment: 1 } } });
    return "OK";
  }, { maxWait: 15000, timeout: 15000 });
}

function shuffle(a, seed = 12345) {
  // deterministic (mulberry32) so a run can be repeated exactly
  let t = seed >>> 0;
  const rnd = () => { t += 0x6D2B79F5; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

module.exports = { db, auditUrl, assertLive, loadState, reset, castVote, shuffle, STATE_FILE };
