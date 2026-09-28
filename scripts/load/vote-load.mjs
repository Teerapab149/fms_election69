// scripts/load/vote-load.mjs — M1: burst load test of POST /api/vote (2026-09-25)
//
// What it exercises — nothing mocked below the HTTP boundary:
//   • the PRODUCTION build (`next start`, NODE_ENV=production) against a real
//     PostgreSQL database, the real Prisma client + pool, the real interactive
//     transaction, the real ChainHead `SELECT … FOR UPDATE`, the real RSA-OAEP
//     encryption and HMAC chain
//   • real NextAuth sessions: every voter signs in through the credentials
//     callback exactly like the e2e suite, so the vote route decodes a genuine
//     session JWT per request
//
// Isolation (same rules as e2e/helpers/testDb.js): its own database whose name
// MUST end in `_e2e` — that is also the only way the mock-login provider can be
// registered on a production build (src/lib/auth.js) — its own port, and a
// throwaway election keypair + chain secret generated for this run, so the
// harness can decrypt every ballot afterwards and prove the recorded choices.
//
//   node scripts/load/vote-load.mjs                       # 50,100,250,500,1000
//   node scripts/load/vote-load.mjs --levels=50,500 --dup=0.1 --pool=17
//
// Options:
//   --levels=a,b,c   concurrent voters per burst (default 50,100,250,500,1000)
//   --dup=0.05       share of voters who double-submit at the same instant
//   --pool=N         append connection_limit=N to DATABASE_URL (default: Prisma's own)
//   --port=3200      server port
//   --db=name_e2e    database name (default <dev db>_load_e2e)
//   --out=file.json  write the full result set as JSON
//   --conn=N         cap in-flight requests at N (models nginx's upstream pool:
//                    clients connect to nginx, nginx forwards over N sockets).
//                    Latency is still measured from the burst release, so time
//                    spent queued for a socket counts. Default: uncapped — every
//                    request opens its own socket at the same instant
//   --tx-wait=MS --tx-timeout=MS   passed to the server as VOTE_TX_MAX_WAIT_MS /
//                    VOTE_TX_TIMEOUT_MS (2000 / 5000 = Prisma's own defaults)
//
// Every level starts from an empty ballot box (guarded TRUNCATE on the _e2e DB).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const require = createRequire(import.meta.url);
const { verifyChain } = require('../lib/chainVerify.js');
const { decryptBallot } = require('../../src/lib/ballotCrypto.js');

// ── args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
}));
const LEVELS = (args.levels || '50,100,250,500,1000').split(',').map(Number).filter(Boolean);
const DUP_RATE = Number(args.dup ?? 0.05);
const PORT = Number(args.port || 3200);
const BASE = `http://localhost:${PORT}`;

// ── env / db ──────────────────────────────────────────────────────────────
function readEnvFile(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(path.join(process.cwd(), file), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}
const fileEnv = { ...readEnvFile('.env'), ...readEnvFile('.env.local') };
const devUrl = process.env.DATABASE_URL || fileEnv.DATABASE_URL;
if (!devUrl) throw new Error('DATABASE_URL not found');
const devName = new URL(devUrl).pathname.slice(1);
const DB_NAME = args.db || `${devName}_load_e2e`;
if (!/^[A-Za-z0-9_]+_e2e$/.test(DB_NAME)) throw new Error(`refusing: load DB "${DB_NAME}" must be a plain identifier ending in _e2e`);
const loadUrl = (() => {
  const u = new URL(devUrl);
  u.pathname = `/${DB_NAME}`;
  if (args.pool) u.searchParams.set('connection_limit', String(args.pool));
  return u.toString();
})();
const adminUrl = (() => { const u = new URL(devUrl); u.pathname = '/postgres'; u.search = ''; return u.toString(); })();

const log = (...m) => console.log('[load]', ...m);

async function ensureDatabase() {
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  const rows = await admin.$queryRawUnsafe('SELECT 1 FROM pg_database WHERE datname = $1', DB_NAME);
  if (rows.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE "${DB_NAME}"`);
  await admin.$disconnect();
}

function run(cmd, argv, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${argv.join(' ')} → ${code}`))));
  });
}

async function assertLoadDb(db) {
  const [{ current_database: name }] = await db.$queryRawUnsafe('SELECT current_database()');
  if (!/_e2e$/.test(name)) throw new Error(`refusing to touch "${name}" — not an _e2e database`);
}

// ── fixture ───────────────────────────────────────────────────────────────
const YEARS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
const MAJORS = ['ACC', 'MKT', 'BIS', 'HRM', 'FIN', 'MGT'];

async function resetFixture(db, voterCount, tag) {
  await assertLoadDb(db);
  await db.$executeRawUnsafe('TRUNCATE TABLE "AdminAuditLog","Ballot","Member","User","Candidate","SystemConfig","Template" RESTART IDENTITY CASCADE');
  await db.$executeRawUnsafe('TRUNCATE TABLE "ChainHead" RESTART IDENTITY CASCADE');
  await db.chainHead.create({ data: { id: 1, head: 'GENESIS', seq: 0 } });
  await db.systemConfig.create({ data: { id: 1, isVoteOpen: true, showResult: false, systemMode: 'MANUAL_OPEN', activeTemplateId: 'receipt' } });
  // A realistic multi-party ballot: 3 real parties + งดออกเสียง (the -1 option
  // exists only on single-party ballots and is rejected here, so it is not seeded).
  await db.candidate.createMany({
    data: [
      { name: 'Load พรรคหนึ่ง', number: 1, score: 0 },
      { name: 'Load พรรคสอง', number: 2, score: 0 },
      { name: 'Load พรรคสาม', number: 3, score: 0 },
      { name: 'งดออกเสียง', number: 0, score: 0 },
    ],
  });
  const users = Array.from({ length: voterCount }, (_, i) => ({
    studentId: `load-${tag}-${String(i).padStart(5, '0')}`,
    name: `Load Voter ${i}`,
    email: `load-${tag}-${i}@mock.dev`,
    facultyId: '30',
    role: 'student',
    year: YEARS[i % 4],
    major: MAJORS[i % MAJORS.length],
    gender: i % 2 ? 'F' : 'M',
    isVoted: false,
    isFormCompleted: false,
    isAdmin: false,
  }));
  for (let i = 0; i < users.length; i += 1000) await db.user.createMany({ data: users.slice(i, i + 1000) });
  return { users, candidates: await db.candidate.findMany({ orderBy: { number: 'desc' } }) };
}

// ── server ────────────────────────────────────────────────────────────────
function startServer(env) {
  const lines = [];
  const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  const onData = (buf) => { for (const l of buf.toString().split(/\r?\n/)) if (l.trim()) lines.push({ t: Date.now(), l }); };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  return { child, lines };
}

async function waitHealthy(child, ms = 90_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`server exited early (${child.exitCode})`);
    try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server never became healthy');
}

function stopServer(child) {
  if (process.platform === 'win32') {
    try { require('node:child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  } else child.kill('SIGTERM');
}

// ── auth: a genuine NextAuth session per voter ────────────────────────────
function cookiesFrom(res) {
  return (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]);
}

async function signIn(studentId) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const jar = cookiesFrom(csrfRes);
  const res = await fetch(`${BASE}/api/auth/callback/mock-login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: jar.join('; ') },
    body: new URLSearchParams({ csrfToken, studentId, callbackUrl: `${BASE}/vote`, json: 'true' }),
  });
  const session = cookiesFrom(res).find((c) => c.startsWith('next-auth.session-token='));
  if (!session) throw new Error(`sign-in failed for ${studentId}: ${res.status}`);
  return session;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ── measurement helpers ───────────────────────────────────────────────────
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0);

function sampleDb(db, dbName) {
  const samples = [];
  let stop = false;
  const loop = (async () => {
    while (!stop) {
      try {
        const [row] = await db.$queryRawUnsafe(`
          SELECT count(*)::int AS total,
                 count(*) FILTER (WHERE state = 'active')::int AS active,
                 count(*) FILTER (WHERE state LIKE 'idle in transaction%')::int AS idle_in_tx,
                 count(*) FILTER (WHERE wait_event_type = 'Lock')::int AS lock_waiters
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid()`, dbName);
        samples.push({ t: Date.now(), ...row });
      } catch {}
      await new Promise((r) => setTimeout(r, 25));
    }
  })();
  return { samples, stop: async () => { stop = true; await loop; } };
}

// ── one burst ─────────────────────────────────────────────────────────────
async function runLevel(level, ctx) {
  const { db, keys, chainSecret } = ctx;
  const tag = `c${level}`;
  log(`── level ${level}: reset fixture (${level} eligible voters) ──`);
  const { users, candidates } = await resetFixture(db, level, tag);

  // realistic choice mix: parties weighted, some abstain
  const weights = [[candidates.find((c) => c.number === 1), 0.4], [candidates.find((c) => c.number === 2), 0.35], [candidates.find((c) => c.number === 3), 0.17], [candidates.find((c) => c.number === 0), 0.08]];
  let seed = level * 7919;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pick = () => { let x = rnd(); for (const [c, w] of weights) { if ((x -= w) <= 0) return c; } return weights[0][0]; };

  const t0 = Date.now();
  const sessions = await mapLimit(users, 16, (u) => signIn(u.studentId));
  log(`signed in ${sessions.length} voters in ${Date.now() - t0}ms (not part of the measured burst)`);

  // plan: every voter sends 1 request; DUP_RATE of them fire a 2nd identical
  // request at the same instant (double-click / client retry race)
  const plan = [];
  users.forEach((u, i) => {
    const choice = pick();
    plan.push({ voter: i, studentId: u.studentId, cookie: sessions[i], candidateId: choice.id, dup: false });
    if (rnd() < DUP_RATE) plan.push({ voter: i, studentId: u.studentId, cookie: sessions[i], candidateId: choice.id, dup: true });
  });

  // warm the route once so compilation-free JIT paths are hot (does not vote: no session)
  await fetch(`${BASE}/api/vote`, { method: 'POST', body: '{}' }).catch(() => {});

  const sampler = sampleDb(ctx.monitor, DB_NAME);
  const logMark = ctx.server.lines.length;
  let release;
  const gate = new Promise((r) => { release = r; });
  // optional in-flight cap (nginx upstream model) — a plain semaphore
  const CONN = Number(args.conn || 0);
  let inFlight = 0;
  const waiters = [];
  // check-and-take must be synchronous: every request reaches acquire() in the
  // same tick after the gate opens, so an increment deferred to a .then() lets
  // all of them through (the first version of this cap did exactly that)
  const acquire = () => {
    if (!CONN || inFlight < CONN) { inFlight++; return Promise.resolve(); }
    return new Promise((r) => waiters.push(r)); // slot handed over by releaseSlot
  };
  const releaseSlot = () => {
    const w = waiters.shift();
    if (w) w(); // hand the slot straight to the next waiter; inFlight unchanged
    else inFlight--;
  };

  let burstStart = 0;
  const pending = plan.map(async (p) => {
    await gate;
    const start = burstStart;
    await acquire();
    try {
      const res = await fetch(`${BASE}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: p.cookie },
        body: JSON.stringify({ candidateId: p.candidateId }),
      });
      const body = await res.text();
      return { ...p, status: res.status, ms: performance.now() - start, body };
    } catch (e) {
      return { ...p, status: 0, ms: performance.now() - start, body: String(e?.cause?.code || e?.message || e) };
    } finally {
      releaseSlot();
    }
  });
  burstStart = performance.now();
  release();
  const results = await Promise.all(pending);
  const wall = performance.now() - burstStart;
  await sampler.stop();
  const serverLog = ctx.server.lines.slice(logMark).map((x) => x.l);

  // ── metrics ──
  const lat = results.map((r) => r.ms).sort((a, b) => a - b);
  const statusDist = {};
  for (const r of results) statusDist[r.status] = (statusDist[r.status] || 0) + 1;
  const ok = results.filter((r) => r.status === 200);
  const okLat = ok.map((r) => r.ms).sort((a, b) => a - b);
  const p2028 = serverLog.filter((l) => /P2028|Transaction (API error|already closed)|Unable to start a transaction/i.test(l)).length;
  const poolTimeout = serverLog.filter((l) => /P2024|Timed out fetching a new connection|connection pool/i.test(l)).length;
  const voteErrors = serverLog.filter((l) => /Vote Error/.test(l)).length;
  const maxOf = (k) => sampler.samples.reduce((m, s) => Math.max(m, s[k] ?? 0), 0);

  // ── invariants ──
  const perVoter = new Map();
  for (const r of results) {
    const v = perVoter.get(r.voter) || { ok: 0, rejectedAlready: 0, other: 0, candidateId: r.candidateId, studentId: r.studentId };
    if (r.status === 200) v.ok++;
    else if (r.status === 403 && /ใช้สิทธิ/.test(r.body)) v.rejectedAlready++;
    else v.other++;
    perVoter.set(r.voter, v);
  }
  const multiWin = [...perVoter.values()].filter((v) => v.ok > 1).length;
  const zeroWin = [...perVoter.values()].filter((v) => v.ok === 0).length;

  const ballots = await db.ballot.findMany({ orderBy: { seq: 'asc' } });
  const scores = await db.candidate.findMany({ select: { id: true, number: true, score: true } });
  const scoreSum = scores.reduce((a, c) => a + c.score, 0);
  const votedUsers = await db.user.findMany({ where: { isVoted: true }, select: { studentId: true, votedAt: true } });
  const votedSet = new Set(votedUsers.map((u) => u.studentId));
  const successSet = new Set([...perVoter.values()].filter((v) => v.ok === 1).map((v) => v.studentId));
  const votedWithoutSuccess = [...votedSet].filter((s) => !successSet.has(s)).length;
  const successWithoutVoted = [...successSet].filter((s) => !votedSet.has(s)).length;
  const head = await db.chainHead.findUnique({ where: { id: 1 } });
  const chain = await verifyChain(db, chainSecret);

  // decrypt every ballot with this run's private key: the box must contain
  // exactly the choices the successful requests asked for, per party
  const decrypted = {};
  for (const b of ballots) { const c = decryptBallot(b.payload, keys.privateKey); decrypted[c] = (decrypted[c] || 0) + 1; }
  const requested = {};
  for (const v of perVoter.values()) if (v.ok === 1) requested[v.candidateId] = (requested[v.candidateId] || 0) + 1;
  const scoreById = Object.fromEntries(scores.map((c) => [c.id, c.score]));
  const choicesMatch = scores.every((c) => (decrypted[c.id] || 0) === (requested[c.id] || 0) && c.score === (requested[c.id] || 0));
  const orphanDecrypt = Object.keys(decrypted).some((id) => !(id in scoreById));

  const inv = {
    'exactly one success per voter (no voter >1)': multiWin === 0,
    'ballots == successful votes': ballots.length === ok.length,
    'sum(score) == ballots': scoreSum === ballots.length,
    'isVoted users == ballots': votedUsers.length === ballots.length,
    'ballot chain verifies (integrity + head + ballots==score + ballots==voted)': chain.ok,
    'no partial commit (isVoted ⇔ 200 response)': votedWithoutSuccess === 0 && successWithoutVoted === 0,
    'no duplicate ballot from double-submits (ChainHead.seq == ballots, seq contiguous)': head.seq === ballots.length && ballots.every((b, i) => b.seq === i + 1),
    'decrypted box == requested choices == Candidate.score, per party': choicesMatch && !orphanDecrypt,
  };

  const summary = {
    level,
    requests: results.length,
    voters: users.length,
    duplicateRequests: plan.filter((p) => p.dup).length,
    success: ok.length,
    failed: results.length - ok.length,
    votersWithNoSuccess: zeroWin,
    statusDist,
    count5xx: results.filter((r) => r.status >= 500).length,
    count409: statusDist[409] || 0,
    count429: statusDist[429] || 0,
    count403AlreadyVoted: results.filter((r) => r.status === 403 && /ใช้สิทธิ/.test(r.body)).length,
    networkErrors: statusDist[0] || 0,
    p2028,
    poolTimeoutLogLines: poolTimeout,
    voteErrorLogLines: voteErrors,
    latencyMs: {
      avg: +(lat.reduce((a, b) => a + b, 0) / (lat.length || 1)).toFixed(1),
      p50: +pct(lat, 50).toFixed(1), p95: +pct(lat, 95).toFixed(1), p99: +pct(lat, 99).toFixed(1), max: +lat[lat.length - 1].toFixed(1),
    },
    successLatencyMs: { p50: +pct(okLat, 50).toFixed(1), p95: +pct(okLat, 95).toFixed(1), p99: +pct(okLat, 99).toFixed(1), max: +(okLat[okLat.length - 1] || 0).toFixed(1) },
    wallMs: +wall.toFixed(0),
    throughputReqPerSec: +(results.length / (wall / 1000)).toFixed(1),
    committedVotesPerSec: +(ok.length / (wall / 1000)).toFixed(1),
    db: {
      maxConnections: maxOf('total'),
      maxActive: maxOf('active'),
      maxIdleInTransaction: maxOf('idle_in_tx'),
      maxLockWaiters: maxOf('lock_waiters'),
      samples: sampler.samples.length,
    },
    invariants: inv,
    allInvariantsHold: Object.values(inv).every(Boolean),
    transportErrors: results.filter((r) => r.status === 0).reduce((acc, r) => {
      const e = (acc[r.body] ||= { count: 0, minMs: Infinity, maxMs: 0 });
      e.count++; e.minMs = Math.min(e.minMs, Math.round(r.ms)); e.maxMs = Math.max(e.maxMs, Math.round(r.ms));
      return acc;
    }, {}),
    sampleErrors: [...new Set(results.filter((r) => r.status !== 200 && !(r.status === 403 && /ใช้สิทธิ/.test(r.body))).map((r) => `${r.status} ${r.body.slice(0, 120)}`))].slice(0, 5),
    serverErrorSample: serverLog.filter((l) => /error|P20\d\d/i.test(l)).slice(0, 5),
  };
  return summary;
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  log(`host: ${os.cpus().length} logical CPUs (${os.cpus()[0].model}), node ${process.version}, ${os.platform()}`);
  log(`db: ${DB_NAME}${args.pool ? ` (connection_limit=${args.pool})` : " (Prisma default pool)"}; levels ${LEVELS.join(', ')}; dup rate ${DUP_RATE}; conn cap ${args.conn || 'none'}; tx maxWait/timeout ${args['tx-wait'] || 'app default'}/${args['tx-timeout'] || 'app default'}`);
  if (!fs.existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'))) throw new Error('no production build (.next/BUILD_ID) — run `npm run build` first');

  await ensureDatabase();
  log('prisma db push → load DB');
  await run('npx', ['prisma', 'db', 'push', '--skip-generate'], { DATABASE_URL: loadUrl.replace(/[?&]connection_limit=\d+/, '') });

  // throwaway election keys for this run only
  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  const chainSecret = crypto.randomBytes(32).toString('hex');

  const db = new PrismaClient({ datasources: { db: { url: loadUrl.replace(/[?&]connection_limit=\d+/, '') } } });
  const monitor = new PrismaClient({ datasources: { db: { url: loadUrl.replace(/[?&]connection_limit=\d+/, '') } } });
  await assertLoadDb(db);
  await resetFixture(db, 1, 'boot');

  const server = startServer({
    DATABASE_URL: loadUrl,
    E2E_MOCK_LOGIN: 'true',
    NEXTAUTH_URL: BASE,
    PORT: String(PORT),
    ELECTION_BALLOT_PUBLIC_KEY: keys.publicKey,
    BALLOT_CHAIN_SECRET: chainSecret,
    BASE_PATH: '',
    NEXT_PUBLIC_BASE_PATH: '',
    ...(args['tx-wait'] ? { VOTE_TX_MAX_WAIT_MS: String(args['tx-wait']) } : {}),
    ...(args['tx-timeout'] ? { VOTE_TX_TIMEOUT_MS: String(args['tx-timeout']) } : {}),
  });
  const results = [];
  try {
    await waitHealthy(server.child);
    const prov = await (await fetch(`${BASE}/api/auth/providers`)).json();
    if (!prov['mock-login']) throw new Error('mock-login provider not registered — is the DB name *_e2e?');
    log(`server up on :${PORT} (pid ${server.child.pid}), providers: ${Object.keys(prov).join(', ')}`);

    for (const level of LEVELS) {
      const s = await runLevel(level, { db, monitor, keys, chainSecret, server });
      results.push(s);
      console.log(JSON.stringify(s, null, 2));
    }
  } finally {
    if (args['server-log']) fs.writeFileSync(args['server-log'], server.lines.map((x) => `${new Date(x.t).toISOString()} ${x.l}`).join('\n'));
    stopServer(server.child);
    await db.$disconnect();
    await monitor.$disconnect();
  }

  console.log('\n=== summary ===');
  console.log('level | req | ok | 5xx | 409 | 429 | P2028 | avg | p50 | p95 | p99 | max (ms) | req/s | votes/s | maxConn | maxLockWait | invariants');
  for (const s of results) {
    console.log([s.level, s.requests, s.success, s.count5xx, s.count409, s.count429, s.p2028, s.latencyMs.avg, s.latencyMs.p50, s.latencyMs.p95, s.latencyMs.p99, s.latencyMs.max, s.throughputReqPerSec, s.committedVotesPerSec, s.db.maxConnections, s.db.maxLockWaiters, s.allInvariantsHold ? 'ALL HOLD' : 'VIOLATED'].join(' | '));
  }
  if (args.out) fs.writeFileSync(args.out, JSON.stringify({ host: { cpus: os.cpus().length, model: os.cpus()[0].model, node: process.version, platform: os.platform() }, db: DB_NAME, pool: args.pool || 'prisma-default', dupRate: DUP_RATE, results }, null, 2));
  if (!results.every((s) => s.allInvariantsHold)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
