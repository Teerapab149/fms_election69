// scripts/load/read-load.mjs — A: read-side load of announcement night (2026-10-01)
//
// What it exercises — nothing mocked below the HTTP boundary:
//   • the PRODUCTION build (`next start`, NODE_ENV=production) against a real
//     PostgreSQL database: SSR pages (root layout + home read the DB on every
//     view), /api/results with its in-process snapshot (lib/election/
//     resultsCache.mjs, 4 s TTL, single-flight, busted by every admin action),
//     /api/check-status, /api/check-form, /api/admin/page-layout
//   • real NextAuth sessions (mock-login credentials callback, like vote-load)
//     and a real admin cookie (POST /api/admin/login against a bcrypt
//     SystemConfig.adminPasswordHash), so the reveal goes through the real
//     POST /api/admin/dashboard SET_SHOW_RESULT path, guards and cache bust
//
// The simulated browser tab mirrors src/app/results/page.js + hooks/useVoteStatus.js:
//   mount  = [GET / + its check-status, share --home-share] → GET /results (HTML)
//            → page-layout + gate (check-status, module cache 15 s; ONGOING and
//            signed in: + check-form) + first /api/results, all at hydration
//            → page-layout again once loading ends (PageThemeOverrides)
//   poll   = /api/results chained on resultsPollDelay() (imported, not copied:
//            10 s ONGOING, 5 s ENDED, 20 s revealed, ±10%), next timeout only
//            after the previous fetch settles
//   change = every new "status|isRevealed" re-runs the gate; from the second
//            key on it is FORCED (skips the 15 s cache) → the reveal burst
//   Nothing polls check-status. Admin tabs (--admin-tabs) poll /api/results
//   every 5 s with the admin cookie = an uncached build each (admin/page.js).
//
// Scenarios (each K starts with fresh tabs; each window ≥ 60 s):
//   ONGOING (MANUAL_OPEN)  K = --ongoing  phases: mount (tabs open over --ramp s)
//                          · poll (public /api/results only — the clean
//                          results-route DB measurement) · mixed (+ admin tabs
//                          + a --trickle votes/s write load)
//   ENDED (awaiting)       K = --ended    same phases, no vote trickle
//   reveal                 K = --reveal tabs polling in ENDED, the admin presses
//                          ประกาศผล → time until 50/95/100 % of tabs saw
//                          isRevealed, and the forced check-status burst
//   storm                  right after: all K tabs reload within --storm s
//
// DB work is read from pg_stat_database for the load DB over a connection to the
// `postgres` DB (so the sampler never counts itself), at window edges only,
// each read taken after an 11 s quiet (PG16 flushes backend stats lazily, up to
// 10 s). One public results build is calibrated the same way before the run
// (lone requests > 4 s apart = one build each, minus an idle baseline). A build
// is 11 SQL statements (traced with log_statement=all) but 17-29 xact in
// pg_stat_database (Prisma's protocol round-trips on fresh pool connections and
// autovacuum visits add xacts), so builds are COUNTED from tup_returned, which
// the eight User scans make ~constant per build (±0.1 %); xact/s is reported too.
//
// Isolation (same rules as vote-load / e2e/helpers/testDb.js): its own database
// whose name MUST end in `_e2e` (also the only way mock-login registers on a
// production build), its own port, throwaway election keys, chain secret,
// NEXTAUTH_SECRET, ADMIN_JWT_SECRET and admin password for this run. The
// shell's DATABASE_URL only supplies host/credentials; the server is started
// with the load DB's URL explicitly. The DB is dropped at the end (--keep-db).
//
//   node scripts/load/read-load.mjs                        # full run, ~30 min
//   node scripts/load/read-load.mjs --only=ended,reveal --ended=2000 --reveal=2000 --ramp=120
//   node scripts/load/read-load.mjs --ongoing=50 --ended= --reveal=50 --window=10 --ramp=5 --storm=5   # smoke
//
// Options:
//   --ongoing=a,b,c  tabs per ONGOING level  (default 500,1000,2000; empty = skip)
//   --ended=a,b,c    tabs per ENDED level    (default 1000,2000,3000; empty = skip)
//   --reveal=K       tabs for reveal + storm (default 2000; 0 = skip)
//   --only=ongoing,ended,reveal   run a subset
//   --voters=3000 --voted=1500    eligible voters (ปี 1-4) and how many already voted
//                    (each voted one has a real encrypted, chained ballot)
//   --window=60      seconds per measured window (< 60 is flagged as not valid for DB numbers)
//   --ramp=30        seconds over which a level's tabs open. Every open is two SSR
//                    page views at most, and SSR is what saturates first (one Node
//                    process): 30 s is the "everyone at once" case, 120 s a spread
//                    one. It also sets up the reveal's tabs — tabs whose opening
//                    failed sit on the page's 30 s "unknown" cadence and blur the
//                    reveal timing (the report counts them: tabsWithGoodBodyAtPress)
//   --storm=45       seconds over which all tabs reload after the reveal
//   --home-share=0.5 share of tab opens that load / first (hard navigation)
//   --admin-tabs=2   admin overview tabs in the mixed / reveal / storm windows
//   --trickle=1      votes per second during the ONGOING mixed window (0 = off)
//   --template=receipt  SystemConfig.activeTemplateId
//   --pool=N         append connection_limit=N to the server's DATABASE_URL
//   --conn=N         cap in-flight requests at N (nginx upstream model; queue
//                    time counts in latency). Default: uncapped (undici keep-alive pool)
//   --port=3200  --db=name_e2e  --out=file.json  --server-log=file  --keep-db
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import { resultsPollDelay } from '../../src/lib/election/resultsPolling.mjs';

const { PrismaClient } = pkg;
const require = createRequire(import.meta.url);
const { verifyChain } = require('../lib/chainVerify.js');
const { encryptBallot, chainHash } = require('../../src/lib/ballotCrypto.js');
const { hourBucketBangkok } = require('../../src/lib/ballotChain.js');

// ── args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
}));
const list = (v, d) => String(v ?? d).split(',').map(Number).filter((n) => n > 0);
const ONLY = args.only ? new Set(args.only.split(',')) : null;
const want = (s) => !ONLY || ONLY.has(s);
const ONGOING = want('ongoing') ? list(args.ongoing, '500,1000,2000') : [];
const ENDED = want('ended') ? list(args.ended, '1000,2000,3000') : [];
const REVEAL_K = want('reveal') ? Number(args.reveal ?? 2000) : 0;
const VOTERS = Number(args.voters || 3000);
const VOTED = Number(args.voted ?? 1500);
const WINDOW_MS = Number(args.window || 60) * 1000;
const RAMP_MS = Number(args.ramp || 30) * 1000;
const STORM_MS = Number(args.storm || 45) * 1000;
const HOME_SHARE = Number(args['home-share'] ?? 0.5);
const ADMIN_TABS = Number(args['admin-tabs'] ?? 2);
const TRICKLE = Number(args.trickle ?? 1);
const TEMPLATE = args.template || 'receipt';
const PORT = Number(args.port || 3200);
const BASE = `http://localhost:${PORT}`;
const FLUSH_MS = 11_000; // PG16 backend stats flush: ≤ 10 s when idle
const CS_TTL_MS = 15_000; // hooks/useVoteStatus.js TTL_MS
const REQ_TIMEOUT_MS = 30_000;
const ADMIN_ID = 'readload-admin';
const ADMIN_PASSWORD = crypto.randomBytes(12).toString('hex');

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
const DB_NAME = args.db || `${devName}_readload_e2e`;
if (!/^[A-Za-z0-9_]+_e2e$/.test(DB_NAME)) throw new Error(`refusing: load DB "${DB_NAME}" must be a plain identifier ending in _e2e`);
const dbUrl = (() => { const u = new URL(devUrl); u.pathname = `/${DB_NAME}`; return u.toString(); })();
const serverUrl = (() => { const u = new URL(dbUrl); if (args.pool) u.searchParams.set('connection_limit', String(args.pool)); return u.toString(); })();
const pgAdminUrl = (() => { const u = new URL(devUrl); u.pathname = '/postgres'; u.search = '?connection_limit=1'; return u.toString(); })();

const T0 = Date.now();
const log = (...m) => console.log(`[read-load +${((Date.now() - T0) / 1000).toFixed(0)}s]`, ...m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function run(cmd, argv, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { env: { ...process.env, ...env }, stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${argv.join(' ')} → ${code}`))));
  });
}

async function assertLoadDb(db) {
  const [{ current_database: name }] = await db.$queryRawUnsafe('SELECT current_database()');
  if (!/_e2e$/.test(name)) throw new Error(`refusing to touch "${name}" — not an _e2e database`);
}

// ── fixture ───────────────────────────────────────────────────────────────
// Realistic shape: 2 parties (12 members each, full policy/mission JSON so the
// results body has its real size) + งดออกเสียง + ไม่รับรอง; VOTERS eligible
// students spread over year/major/gender + non-eligible rows the `year IN`
// filter has to skip; VOTED of them voted, each with a real encrypted ballot on
// a valid chain and Candidate.score to match (verifyChain passes on it).
const YEARS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
const MAJORS = ['ACC', 'MKT', 'BIS', 'HRM', 'FIN', 'MGT', 'HOS', 'ECON'];
const lorem = (n, seed) => Array.from({ length: n }, (_, i) => `นโยบายข้อ ${seed}-${i + 1} พัฒนากิจกรรมนักศึกษาและสวัสดิการให้ครอบคลุมทุกชั้นปี`).join(' ');

async function seedFixture(db, keys, chainSecret) {
  await assertLoadDb(db);
  await db.$executeRawUnsafe('TRUNCATE TABLE "AdminAuditLog","Ballot","Member","User","Candidate","SystemConfig","Template" RESTART IDENTITY CASCADE');
  await db.$executeRawUnsafe('TRUNCATE TABLE "ChainHead" RESTART IDENTITY CASCADE');
  await db.systemConfig.create({
    data: {
      id: 1, isVoteOpen: true, showResult: false, systemMode: 'MANUAL_OPEN', activeTemplateId: TEMPLATE,
      googleFormUrl: 'https://docs.google.com/forms/d/e/READLOAD_E2E/viewform',
      adminPasswordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });
  const party = (number, name, color) => ({
    name, number, score: 0, color, slogan: `${name} — ทำจริง ทำได้ เพื่อทุกคน`,
    logoUrl: `/images/logo/p${number}.png`, logoMeaning: lorem(2, `logo${number}`),
    groupImageUrls: [`/images/party/p${number}-1.jpg`, `/images/party/p${number}-2.jpg`],
    mobileHeroImage: { src: `/images/party/p${number}-m.jpg` },
    missions: Array.from({ length: 5 }, (_, i) => ({ title: `พันธกิจ ${i + 1}`, detail: lorem(2, `m${number}${i}`) })),
    policies: Array.from({ length: 8 }, (_, i) => ({ title: `นโยบาย ${i + 1}`, detail: lorem(3, `p${number}${i}`) })),
  });
  await db.candidate.createMany({
    data: [party(1, 'พรรคโหลดหนึ่ง', '#8A2680'), party(2, 'พรรคโหลดสอง', '#2680A2'), { name: 'งดออกเสียง', number: 0, score: 0 }, { name: 'ไม่รับรอง', number: -1, score: 0 }],
  });
  const cands = await db.candidate.findMany();
  const byNum = Object.fromEntries(cands.map((c) => [c.number, c]));
  const POS = ['นายกสโมสร', 'อุปนายกฝ่ายบริหาร', 'อุปนายกฝ่ายกิจการ', 'เลขานุการ', 'เหรัญญิก', 'ประชาสัมพันธ์', 'กรรมการฝ่ายกีฬา', 'กรรมการฝ่ายศิลป์', 'กรรมการฝ่ายวิชาการ', 'กรรมการฝ่ายสวัสดิการ', 'กรรมการฝ่ายสถานที่', 'กรรมการฝ่ายพัสดุ'];
  await db.member.createMany({
    data: [1, 2].flatMap((n) => POS.map((position, i) => ({
      studentId: `rl-mem-${n}-${i}`, name: `สมาชิก ${n}-${i + 1} นามสกุลทดสอบ`, number: i + 1, position,
      major: MAJORS[i % MAJORS.length], imageUrl: `/images/members/${n}-${i}.jpg`, modalImageUrl: `/images/members/${n}-${i}-full.jpg`,
      candidateId: byNum[n].id,
    }))),
  });

  let seed = 20261001;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const votedIdx = new Set();
  while (votedIdx.size < Math.min(VOTED, VOTERS)) votedIdx.add(Math.floor(rnd() * VOTERS));
  const now = Date.now();
  const users = Array.from({ length: VOTERS }, (_, i) => ({
    studentId: `rl-${String(i).padStart(5, '0')}`, name: `Read Load ${i}`, email: `rl-${i}@mock.dev`, facultyId: '30', role: 'student',
    year: YEARS[Math.floor(rnd() * 4)], major: MAJORS[Math.floor(rnd() * MAJORS.length)], gender: rnd() < 0.62 ? 'F' : 'M',
    isVoted: votedIdx.has(i), isFormCompleted: votedIdx.has(i), isAdmin: false,
    votedAt: votedIdx.has(i) ? new Date(now - Math.floor(rnd() * 3_600_000)) : null,
  }));
  // not eligible: graduates / staff rows with no or another year
  for (let i = 0; i < 150; i++) users.push({ studentId: `rl-x${i}`, name: `Not Eligible ${i}`, email: `rlx-${i}@mock.dev`, facultyId: '30', role: 'student', year: i % 2 ? 'ปี 5' : null, major: MAJORS[i % MAJORS.length], gender: i % 2 ? 'F' : 'M', isVoted: false, isFormCompleted: false, isAdmin: false });
  users.push({ studentId: ADMIN_ID, name: 'Read Load Admin', email: 'readload-admin@mock.dev', facultyId: '30', role: 'ADMIN', year: null, isVoted: false, isFormCompleted: false, isAdmin: true });
  for (let i = 0; i < users.length; i += 1000) await db.user.createMany({ data: users.slice(i, i + 1000) });

  // ballots: same chain the vote route builds (encrypt → chainHash(prev, payload, seq))
  const mix = [[byNum[1], 0.47], [byNum[2], 0.41], [byNum[0], 0.12]];
  const pick = () => { let x = rnd(); for (const [c, w] of mix) if ((x -= w) <= 0) return c; return mix[0][0]; };
  const ballots = []; const score = {};
  let prev = 'GENESIS';
  const bucket = hourBucketBangkok(now);
  for (let s = 1; s <= votedIdx.size; s++) {
    const c = pick(); score[c.id] = (score[c.id] || 0) + 1;
    const payload = encryptBallot(c.id, keys.publicKey);
    const rowHash = chainHash(chainSecret, prev, payload, s);
    ballots.push({ seq: s, payload, hourBucket: bucket, prevHash: prev, rowHash });
    prev = rowHash;
  }
  for (let i = 0; i < ballots.length; i += 500) await db.ballot.createMany({ data: ballots.slice(i, i + 500) });
  await db.chainHead.create({ data: { id: 1, head: prev, seq: ballots.length } });
  for (const [id, n] of Object.entries(score)) await db.candidate.update({ where: { id: Number(id) }, data: { score: n } });
  const chain = await verifyChain(db, chainSecret);
  if (!chain.ok) throw new Error(`fixture chain does not verify: ${JSON.stringify(chain.checks)}`);
  return {
    voted: users.filter((u) => u.isVoted).map((u) => u.studentId),
    unvoted: users.filter((u) => !u.isVoted && YEARS.includes(u.year)).map((u) => u.studentId),
    candidates: cands, chain: chain.counts,
  };
}

// ── server ────────────────────────────────────────────────────────────────
function startServer(env) {
  const lines = [];
  const child = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
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
    await sleep(500);
  }
  throw new Error('server never became healthy');
}
function stopServer(child) {
  try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
}

// ── CPU accounting from /proc (server process tree, all postgres backends) ──
const CLK = (() => { try { return Number(execSync('getconf CLK_TCK').toString()) || 100; } catch { return 100; } })();
function procTable() {
  const out = [];
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const s = fs.readFileSync(`/proc/${d}/stat`, 'utf8');
      const comm = s.slice(s.indexOf('(') + 1, s.lastIndexOf(')'));
      const f = s.slice(s.lastIndexOf(')') + 2).split(' ');
      out.push({ pid: Number(d), comm, ppid: Number(f[1]), cpu: (Number(f[11]) + Number(f[12])) / CLK });
    } catch {}
  }
  return out;
}
function cpuSnapshot(rootPid) {
  const t = procTable();
  const tree = new Set([rootPid]);
  let grew = true;
  while (grew) { grew = false; for (const p of t) if (!tree.has(p.pid) && tree.has(p.ppid)) { tree.add(p.pid); grew = true; } }
  return {
    server: t.filter((p) => tree.has(p.pid)).reduce((a, p) => a + p.cpu, 0),
    postgres: t.filter((p) => p.comm === 'postgres').reduce((a, p) => a + p.cpu, 0),
    gen: process.cpuUsage(),
  };
}

// ── HTTP + per-phase recording ────────────────────────────────────────────
const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0);
const r1 = (x) => +Number(x).toFixed(1);

class Phase {
  constructor(name, meta = {}) {
    Object.assign(this, { name, meta, recs: new Map(), late: [], marks: {} });
    this.lag = monitorEventLoopDelay({ resolution: 10 });
    this.lag.enable();
    this.t0 = performance.now();
  }
  record(ep, r) { if (!this.recs.has(ep)) this.recs.set(ep, []); this.recs.get(ep).push(r); }
  end() { this.t1 = performance.now(); this.lag.disable(); }
  get seconds() { return (this.t1 - this.t0) / 1000; }
  summary() {
    const eps = {};
    let total = 0, totalOk = 0;
    for (const [ep, rs] of this.recs) {
      const lat = rs.map((r) => r.ms).sort((a, b) => a - b);
      const mix = {};
      for (const r of rs) { const k = r.err ? `ERR ${r.err}` : r.ok ? `${r.status}` : `${r.status} invalid`; mix[k] = (mix[k] || 0) + 1; }
      const ok = rs.filter((r) => r.ok).length;
      total += rs.length; totalOk += ok;
      eps[ep] = { n: rs.length, validPct: +(100 * ok / (rs.length || 1)).toFixed(2), mix, p50: r1(pct(lat, 50)), p95: r1(pct(lat, 95)), p99: r1(pct(lat, 99)), max: r1(lat[lat.length - 1] || 0), perSec: r1(rs.length / this.seconds) };
    }
    const late = [...this.late].sort((a, b) => a - b);
    return {
      name: this.name, ...this.meta, seconds: r1(this.seconds), requests: total, validPct: +(100 * totalOk / (total || 1)).toFixed(3), reqPerSec: r1(total / this.seconds), endpoints: eps,
      // the histogram records the whole 10 ms sampling interval: lag = value − 10 ms
      genLagMs: { p50: r1(Math.max(0, this.lag.percentile(50) / 1e6 - 10)), p99: r1(Math.max(0, this.lag.percentile(99) / 1e6 - 10)), max: r1(Math.max(0, this.lag.max / 1e6 - 10)) },
      pollLatenessMs: { p95: r1(pct(late, 95)), max: r1(late[late.length - 1] || 0) },
      ...this.marks,
    };
  }
}
let CUR = null;
const INFLIGHT = new Set();

const CONN = Number(args.conn || 0);
let inFlight = 0;
const waiters = [];
const acquire = () => { if (!CONN || inFlight < CONN) { inFlight++; return Promise.resolve(); } return new Promise((r) => waiters.push(r)); };
const releaseSlot = () => { const w = waiters.shift(); if (w) w(); else inFlight--; };

const jsonOk = (pred) => (res, text) => {
  if (res.status !== 200) return { ok: false };
  try { const j = JSON.parse(text); return { ok: !!pred(j), data: j }; } catch { return { ok: false }; }
};
const htmlOk = (res, text) => ({ ok: res.status === 200 && text.includes('</html>') });
const V = {
  results: jsonOk((j) => typeof j.status === 'string'),
  status: jsonOk((j) => typeof j.systemMode === 'string' && typeof j.electionStatus === 'string'),
  layout: jsonOk((j) => typeof j.activeTemplateId === 'string'),
  form: jsonOk((j) => typeof j.isFormCompleted === 'boolean'),
  vote: jsonOk((j) => j.success === true),
};

function http(ep, url, { method = 'GET', headers = {}, body, validate, tag } = {}) {
  const phase = CUR;
  const p = (async () => {
    const t0 = performance.now();
    await acquire();
    let status = 0, ok = false, data = null, err = null;
    try {
      const res = await fetch(BASE + url, { method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(REQ_TIMEOUT_MS) });
      status = res.status;
      const text = await res.text();
      ({ ok, data = null } = validate(res, text));
    } catch (e) {
      err = String(e?.cause?.code || e?.name || e?.message || e);
    } finally {
      releaseSlot();
    }
    const t = performance.now();
    phase?.record(ep, { ms: t - t0, status, ok, err, t, tag });
    return { ok, status, data, t };
  })();
  INFLIGHT.add(p);
  p.finally(() => INFLIGHT.delete(p));
  return p;
}
async function drain() { while (INFLIGHT.size || MOUNTS.size) await Promise.allSettled([...INFLIGHT, ...MOUNTS]); }

// ── the simulated /results tab ────────────────────────────────────────────
const MOUNTS = new Set();
const EP = { home: 'GET / (HTML)', page: 'GET /results (HTML)', layout: '/api/admin/page-layout', status: '/api/check-status', form: '/api/check-form', results: '/api/results' };

class Tab {
  constructor(id, cookie) { Object.assign(this, { id, cookie, gen: 0, alive: false, paused: false, timer: null, intended: 0, revealedAt: null }); }
  get h() { return { cookie: this.cookie }; }
  reset() { this.cs = { data: null, ts: 0, promise: null }; this.last = {}; this.gateKey = null; this.gateKeySeen = null; this.inFlight = false; }
  unmount() { this.alive = false; this.gen++; clearTimeout(this.timer); this.timer = null; }

  // hooks/useVoteStatus.js fetchVoteStatus: 15 s per-tab module cache + dedupe
  fetchVoteStatus(force, tag) {
    const c = this.cs;
    if (!force && c.data && Date.now() - c.ts < CS_TTL_MS) return Promise.resolve(c.data);
    if (c.promise) return c.promise;
    const cs = this.cs;
    cs.promise = http(EP.status, '/api/check-status', { headers: this.h, validate: V.status, tag }).then((r) => {
      if (r.ok) { if (this.cs === cs) this.cs = { data: r.data, ts: Date.now(), promise: null }; return r.data; }
      cs.promise = null; return null;
    });
    return cs.promise;
  }

  // results/page.js gate effect (deps: gateKey)
  async runGate(gen) {
    const force = this.gateKeySeen !== null && this.gateKey !== null && this.gateKey !== this.gateKeySeen;
    const key = this.gateKey;
    const sd = await this.fetchVoteStatus(force, force ? 'forced' : undefined);
    if (!sd || gen !== this.gen) return;
    if (key !== null) this.gateKeySeen = key;
    if (sd.systemMode === 'ENDED' || sd.electionStatus === 'ENDED' || sd.showResult === true) return;
    if (sd.systemMode === 'PAUSE') return;
    // (campaign-window exception skipped: the fixture is MANUAL_OPEN → ONGOING)
    const ud = await this.fetchVoteStatus(false);
    if (!ud?.isVoted || gen !== this.gen) return;
    if (String(sd.googleFormUrl || '').trim()) await http(EP.form, '/api/check-form', { headers: this.h, validate: V.form });
  }

  async mount(home) {
    this.unmount(); this.reset();
    const gen = this.gen; this.alive = true;
    if (home) {
      // hard navigation: home SSR + its useVoteStatus (signed in), then a fresh page
      await http(EP.home, '/', { headers: this.h, validate: htmlOk });
      await this.fetchVoteStatus(false);
      this.reset();
    }
    await http(EP.page, '/results', { headers: this.h, validate: htmlOk });
    if (gen !== this.gen) return;
    const layout = http(EP.layout, '/api/admin/page-layout', { headers: this.h, validate: V.layout });
    const gate = this.runGate(gen);
    this.tick(gen);
    await Promise.all([layout, gate]);
    if (gen === this.gen) await http(EP.layout, '/api/admin/page-layout', { headers: this.h, validate: V.layout }); // PageThemeOverrides
  }
  mountTracked(home) { const p = this.mount(home).catch((e) => log('mount error', e.message)); MOUNTS.add(p); p.finally(() => MOUNTS.delete(p)); }

  schedule(gen, delay) {
    clearTimeout(this.timer); this.timer = null;
    if (!this.alive || this.paused || gen !== this.gen) return;
    const d = delay ?? resultsPollDelay(this.last);
    this.intended = performance.now() + d;
    this.timer = setTimeout(() => this.tick(gen, true), d);
  }
  async tick(gen, scheduled = false) {
    this.timer = null;
    if (!this.alive || this.paused || gen !== this.gen || this.inFlight) return;
    if (scheduled && CUR) CUR.late.push(performance.now() - this.intended);
    this.inFlight = true;
    try {
      const r = await http(EP.results, '/api/results', { headers: this.h, validate: V.results });
      if (r.ok && gen === this.gen) {
        const d = r.data;
        if (d.isRevealed && this.revealedAt === null) this.revealedAt = r.t;
        this.last = { status: d.status, isRevealed: d.isRevealed, certified: d.certified };
        const key = `${d.status}|${!!d.isRevealed}`;
        if (key !== this.gateKey) { this.gateKey = key; this.runGate(gen); }
      }
    } finally { if (gen === this.gen) this.inFlight = false; } // a reload's old chain must not clear the new one's flag
    this.schedule(gen);
  }
  pause() { this.paused = true; clearTimeout(this.timer); this.timer = null; }
  resume() {
    this.paused = false;
    if (this.alive) this.schedule(this.gen, Math.floor(Math.random() * resultsPollDelay(this.last))); // steady state: desynchronised
  }
}

// ── side loads: admin overview tabs, vote trickle ─────────────────────────
function startAdminTabs(cookie) {
  const timers = [];
  for (let i = 0; i < ADMIN_TABS; i++) {
    const go = () => http('admin /api/results (uncached)', `/api/results?t=${Date.now()}`, { headers: { cookie }, validate: V.results });
    timers.push(setTimeout(() => { go(); timers.push(setInterval(go, 5000)); }, Math.floor((i * 5000) / Math.max(1, ADMIN_TABS))));
  }
  return () => timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
}
function startTrickle(pool, candidates) {
  if (!TRICKLE) return () => {};
  const choices = candidates.filter((c) => c.number >= 0);
  const t = setInterval(() => {
    const v = pool.shift();
    if (!v) return;
    const c = choices[Math.floor(Math.random() * choices.length)];
    http('POST /api/vote (trickle)', '/api/vote', { method: 'POST', headers: { cookie: v.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId: c.id }), validate: V.vote });
  }, Math.round(1000 / TRICKLE));
  return () => clearInterval(t);
}

// ── auth ──────────────────────────────────────────────────────────────────
const cookiesFrom = (res) => (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]);
async function signIn(studentId) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${BASE}/api/auth/callback/mock-login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: cookiesFrom(csrfRes).join('; ') },
    body: new URLSearchParams({ csrfToken, studentId, callbackUrl: `${BASE}/results`, json: 'true' }),
  });
  const session = cookiesFrom(res).find((c) => c.startsWith('next-auth.session-token='));
  if (!session) throw new Error(`sign-in failed for ${studentId}: ${res.status}`);
  return session;
}
async function adminLogin() {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.77.${crypto.randomInt(255)}.${crypto.randomInt(255)}` },
    body: JSON.stringify({ username: ADMIN_ID, password: ADMIN_PASSWORD }),
  });
  const c = cookiesFrom(res).find((x) => x.startsWith('admin_token='));
  if (!c) throw new Error(`admin login failed: ${res.status} ${await res.text()}`);
  return c;
}
async function adminAction(cookie, body) {
  const res = await fetch(`${BASE}/api/admin/dashboard`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${body.action} → ${res.status} ${text}`);
  return text;
}
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

// ── DB-side measurement (connection to `postgres`, never to the load DB) ──
async function pgStats(pg) {
  const [r] = await pg.$queryRawUnsafe(`
    SELECT (xact_commit + xact_rollback)::float8 AS xact, tup_returned::float8 AS tup_returned, tup_fetched::float8 AS tup_fetched,
           (tup_inserted + tup_updated + tup_deleted)::float8 AS tup_written, blks_read::float8 AS blks_read, numbackends::int AS backends
    FROM pg_stat_database WHERE datname = $1`, DB_NAME);
  return { ...r, at: performance.now() };
}
function activitySampler(pg) {
  let stop = false; const s = { maxConn: 0, maxActive: 0, n: 0 };
  const loop = (async () => {
    while (!stop) {
      try {
        const [r] = await pg.$queryRawUnsafe(`SELECT count(*)::int AS total, count(*) FILTER (WHERE state = 'active')::int AS active FROM pg_stat_activity WHERE datname = $1`, DB_NAME);
        s.maxConn = Math.max(s.maxConn, r.total); s.maxActive = Math.max(s.maxActive, r.active); s.n++;
      } catch {}
      await sleep(1000);
    }
  })();
  return { s, stop: async () => { stop = true; await loop; } };
}

// A measured window. Precondition: no load for ≥ FLUSH_MS (every caller ends
// with the same wait), so the opening read is complete; the closing read waits
// FLUSH_MS after the load stopped. `load(phase)` must leave everything paused
// and drained.
async function measured(ctx, name, meta, load) {
  const s0 = await pgStats(ctx.pg);
  const cpu0 = cpuSnapshot(ctx.server.child.pid);
  const act = activitySampler(ctx.pg);
  const ph = new Phase(name, meta);
  CUR = ph;
  log(`▶ ${name}`);
  await load(ph);
  ph.end(); CUR = null;
  const cpu1 = cpuSnapshot(ctx.server.child.pid);
  await sleep(FLUSH_MS);
  const s1 = await pgStats(ctx.pg);
  await act.stop();
  const sec = ph.seconds;
  ph.marks.db = {
    windowSec: r1(sec), xact: s1.xact - s0.xact, xactPerSec: r1((s1.xact - s0.xact) / sec), tupReturnedPerSec: Math.round((s1.tup_returned - s0.tup_returned) / sec),
    tupFetchedPerSec: Math.round((s1.tup_fetched - s0.tup_fetched) / sec), tupWritten: s1.tup_written - s0.tup_written, blksRead: s1.blks_read - s0.blks_read,
    maxConnections: act.s.maxConn, maxActive: act.s.maxActive,
  };
  ph.marks.cpuCores = { // postgres: live backends only (an exited backend takes its CPU time with it) → lower bound
    server: +((cpu1.server - cpu0.server) / sec).toFixed(2), postgres: +Math.max(0, (cpu1.postgres - cpu0.postgres) / sec).toFixed(2),
    generator: +(((cpu1.gen.user + cpu1.gen.system) - (cpu0.gen.user + cpu0.gen.system)) / 1e6 / sec).toFixed(2),
  };
  ph.marks.db.tupReturned = s1.tup_returned - s0.tup_returned;
  if (ctx.buildCal && meta.resultsOnly) {
    const span = (s1.at - s0.at) / 1000; // idle baseline accrues over the whole span incl. the flush wait
    const cal = ctx.buildCal;
    // late gate re-runs (a tab whose mount failed reads its first good body here)
    // land check-status / check-form calls in this window: take their calibrated cost out
    const nCs = ph.recs.get(EP.status)?.length || 0, nForm = ph.recs.get(EP.form)?.length || 0;
    const otherTup = nCs * cal.tupPerCheckStatus + nForm * cal.tupPerCheckForm, otherXact = nCs * cal.xactPerCheckStatus + nForm * cal.xactPerCheckForm;
    const builds = (ph.marks.db.tupReturned - cal.idleTupPerSec * span - otherTup) / cal.tupReturnedPerBuild;
    const buildsByXact = (ph.marks.db.xact - cal.idleXactPerSec * span - otherXact) / cal.xactPerBuild;
    ph.marks.db.nonResultsCalls = { checkStatus: nCs, checkForm: nForm, tupSubtracted: Math.round(otherTup), xactSubtracted: Math.round(otherXact) };
    const bound = Math.floor((sec * 1000) / 4000) + 1 + (meta.busts || 0);
    const served = ph.recs.get(EP.results)?.length || 0;
    ph.marks.resultsBuilds = { estimate: r1(builds), byXact: r1(buildsByXact), bound, withinBound: builds <= bound + 0.5, requestsServed: served, requestsPerBuild: r1(served / Math.max(builds, 1e-9)) };
  }
  const sum = ph.summary();
  log(`■ ${name}: ${sum.requests} req, ${sum.reqPerSec} req/s, valid ${sum.validPct}%, results p95 ${sum.endpoints[EP.results]?.p95 ?? '-'} ms, db ${ph.marks.db.xactPerSec} xact/s, lag p99 ${sum.genLagMs.p99} ms`);
  ctx.phases.push(sum);
  return ph;
}

const pauseAll = (tabs) => tabs.forEach((t) => t.pause());
const resumeAll = (tabs) => tabs.forEach((t) => t.resume());
const unmountAll = (tabs) => tabs.forEach((t) => t.unmount());
function makeTabs(K, sessions) { return Array.from({ length: K }, (_, i) => new Tab(i, sessions[i % sessions.length])); }
function scheduleOver(tabs, ms, fn) { return tabs.map((t) => setTimeout(() => fn(t), Math.floor(Math.random() * ms))); }

// one level: mount → poll (results only) → mixed (+admin tabs, +votes when open)
async function runLevel(ctx, mode, K) {
  const tabs = makeTabs(K, ctx.sessions);
  const tag = `${mode} K=${K}`;
  await measured(ctx, `${tag} · mount`, { mode, K, phase: 'mount' }, async () => {
    scheduleOver(tabs, RAMP_MS, (t) => t.mountTracked(Math.random() < HOME_SHARE));
    await sleep(Math.max(WINDOW_MS, RAMP_MS + 5000));
    pauseAll(tabs); await drain();
  });
  await measured(ctx, `${tag} · poll`, { mode, K, phase: 'poll', resultsOnly: true }, async () => {
    resumeAll(tabs); await sleep(WINDOW_MS); pauseAll(tabs); await drain();
  });
  await measured(ctx, `${tag} · mixed`, { mode, K, phase: 'mixed' }, async () => {
    resumeAll(tabs);
    const stopA = startAdminTabs(ctx.adminCookie);
    const stopV = mode === 'ONGOING' ? startTrickle(ctx.trickle, ctx.candidates) : () => {};
    await sleep(WINDOW_MS);
    stopA(); stopV(); pauseAll(tabs); await drain();
  });
  unmountAll(tabs);
}

async function runReveal(ctx, K) {
  const tabs = makeTabs(K, ctx.sessions);
  log(`reveal K=${K}: opening tabs (not measured)`);
  CUR = null;
  scheduleOver(tabs, RAMP_MS, (t) => t.mountTracked(Math.random() < HOME_SHARE));
  await sleep(RAMP_MS + 5000);
  pauseAll(tabs); await drain(); await sleep(FLUSH_MS);

  const rv = {};
  await measured(ctx, `reveal K=${K}`, { mode: 'ENDED→revealed', K, phase: 'reveal' }, async (ph) => {
    resumeAll(tabs);
    const stopA = startAdminTabs(ctx.adminCookie);
    await sleep(15_000);
    const before = tabs.filter((t) => t.revealedAt !== null).length;
    // a tab that never got a good body polls on the 30 s "unknown" cadence; one whose
    // gate never completed sends an unforced check-status on the change instead
    rv.goodBody = tabs.filter((t) => typeof t.last.status === 'string').length;
    rv.gateSeen = tabs.filter((t) => t.gateKeySeen !== null).length;
    rv.tSend = performance.now();
    await adminAction(ctx.adminCookie, { action: 'SET_SHOW_RESULT', value: true });
    rv.tResp = performance.now();
    const until = rv.tResp + Math.max(60_000, WINDOW_MS - 15_000);
    while (performance.now() < until) await sleep(250);
    stopA(); pauseAll(tabs); await drain();

    const seen = tabs.map((t) => (t.revealedAt === null ? Infinity : t.revealedAt - rv.tResp)).sort((a, b) => a - b);
    const at = (p) => { const v = seen[Math.min(K - 1, Math.ceil(p * K) - 1)]; return Number.isFinite(v) ? r1(v / 1000) : 'never'; };
    const boundS = 10; // ENDED poll 5 s + 5 s
    const forced = (ph.recs.get(EP.status) || []).filter((r) => r.tag === 'forced');
    const fl = forced.map((r) => r.ms).sort((a, b) => a - b);
    const perSec = {};
    for (const r of forced) { const s = Math.floor((r.t - rv.tResp) / 1000); perSec[s] = (perSec[s] || 0) + 1; }
    ph.marks.reveal = {
      tabsRevealedBeforePress: before,
      tabsWithGoodBodyAtPress: rv.goodBody,
      tabsWithCompletedGateAtPress: rv.gateSeen,
      adminPressMs: r1(rv.tResp - rv.tSend),
      secondsAfterPressResponse: { p50: at(0.5), p95: at(0.95), p100: at(1) },
      within10sPct: +(100 * seen.filter((v) => v <= boundS * 1000).length / K).toFixed(2),
      neverSaw: seen.filter((v) => !Number.isFinite(v)).length,
      forcedCheckStatus: {
        n: forced.length, ok: forced.filter((r) => r.ok).length, firstS: r1((Math.min(...forced.map((r) => r.t)) - rv.tResp) / 1000), lastS: r1((Math.max(...forced.map((r) => r.t)) - rv.tResp) / 1000),
        maxPerSec: Math.max(0, ...Object.values(perSec)), p50: r1(pct(fl, 50)), p95: r1(pct(fl, 95)), p99: r1(pct(fl, 99)), max: r1(fl[fl.length - 1] || 0),
      },
    };
  });

  await measured(ctx, `storm K=${K} (all tabs reload within ${STORM_MS / 1000}s after reveal)`, { mode: 'revealed', K, phase: 'storm' }, async () => {
    resumeAll(tabs);
    const stopA = startAdminTabs(ctx.adminCookie);
    scheduleOver(tabs, STORM_MS, (t) => t.mountTracked(Math.random() < HOME_SHARE));
    await sleep(Math.max(WINDOW_MS, STORM_MS + 15_000));
    stopA(); pauseAll(tabs); await drain();
  });
  unmountAll(tabs);
}

// one public build, measured: a lone request after the 4 s TTL ran out = one
// build; an idle window of the same length first gives the background rate
async function calibrate(ctx) {
  const N = 8;
  const i0 = await pgStats(ctx.pg);
  await sleep(30_000);
  const i1 = await pgStats(ctx.pg);
  const idleSec = (i1.at - i0.at) / 1000;
  const idleXactPerSec = (i1.xact - i0.xact) / idleSec, idleTupPerSec = (i1.tup_returned - i0.tup_returned) / idleSec;
  const s0 = i1;
  for (let i = 0; i < N; i++) { await sleep(4500); const r = await http('calibration', '/api/results', { validate: V.results }); if (!r.ok) throw new Error('calibration request failed'); }
  await sleep(FLUSH_MS);
  const s1 = await pgStats(ctx.pg);
  const span = (s1.at - s0.at) / 1000;
  // signed-in check-status / check-form, 40 each (same cookie set the tabs use)
  const per = async (url, validate) => {
    const a = await pgStats(ctx.pg);
    for (let i = 0; i < 40; i++) { const r = await http('calibration', url, { headers: { cookie: ctx.sessions[i % ctx.sessions.length] }, validate }); if (!r.ok) throw new Error(`calibration ${url} failed`); }
    await sleep(FLUSH_MS);
    const b = await pgStats(ctx.pg);
    return { xact: +((b.xact - a.xact) / 40).toFixed(2), tup: +((b.tup_returned - a.tup_returned) / 40).toFixed(1) };
  };
  const cs = await per('/api/check-status', V.status);
  const form = await per('/api/check-form', V.form);
  return {
    builds: N, idleSec: r1(idleSec), idleXactPerSec: +idleXactPerSec.toFixed(3), idleTupPerSec: +idleTupPerSec.toFixed(1),
    xactPerBuild: r1((s1.xact - s0.xact - idleXactPerSec * span) / N), tupReturnedPerBuild: Math.round((s1.tup_returned - s0.tup_returned - idleTupPerSec * span) / N),
    xactPerCheckStatus: cs.xact, tupPerCheckStatus: cs.tup, xactPerCheckForm: form.xact, tupPerCheckForm: form.tup,
  };
}

// ── report ────────────────────────────────────────────────────────────────
function printReport(out) {
  const eps = [EP.page, EP.home, EP.results, EP.status, EP.layout, EP.form, 'admin /api/results (uncached)', 'POST /api/vote (trickle)'];
  console.log('\n=== machine ===');
  console.log(JSON.stringify(out.host));
  const c = out.calibration;
  console.log(`calibration: one public /api/results build = ${c.xactPerBuild} xact, ${c.tupReturnedPerBuild} tup_returned (n=${c.builds}); idle ${c.idleXactPerSec} xact/s, ${c.idleTupPerSec} tup/s; signed-in check-status = ${c.xactPerCheckStatus} xact / ${c.tupPerCheckStatus} tup; check-form = ${c.xactPerCheckForm} xact / ${c.tupPerCheckForm} tup`);
  console.log('\n=== windows ===');
  console.log('phase | s | req | req/s | valid% | db xact/s | tup_ret/s | maxConn | cpu cores srv/pg/gen | gen lag p50/p99/max ms | poll late p95/max ms | results builds (tup) / (xact) / bound · req per build');
  for (const p of out.phases) {
    console.log([p.name, p.seconds, p.requests, p.reqPerSec, p.validPct, p.db.xactPerSec, p.db.tupReturnedPerSec, p.db.maxConnections,
      `${p.cpuCores.server}/${p.cpuCores.postgres}/${p.cpuCores.generator}`, `${p.genLagMs.p50}/${p.genLagMs.p99}/${p.genLagMs.max}`,
      `${p.pollLatenessMs.p95}/${p.pollLatenessMs.max}`, p.resultsBuilds ? `${p.resultsBuilds.estimate} / ${p.resultsBuilds.byXact} / ${p.resultsBuilds.bound} · ${p.resultsBuilds.requestsPerBuild}` : '-'].join(' | '));
  }
  console.log('\n=== endpoints (n · valid% · p50/p95/p99/max ms · req/s) ===');
  for (const p of out.phases) {
    console.log(`-- ${p.name}`);
    for (const ep of eps) {
      const e = p.endpoints[ep]; if (!e) continue;
      const bad = Object.entries(e.mix).filter(([k]) => k !== '200').map(([k, v]) => `${k}×${v}`).join(', ');
      console.log(`   ${ep.padEnd(30)} ${String(e.n).padStart(6)} · ${e.validPct}% · ${e.p50}/${e.p95}/${e.p99}/${e.max} · ${e.perSec}/s${bad ? `  [${bad}]` : ''}`);
    }
  }
  for (const p of out.phases.filter((x) => x.reveal)) { console.log(`\n=== ${p.name} ===`); console.log(JSON.stringify(p.reveal, null, 2)); }
  console.log('\n=== verdict ===');
  for (const [k, v] of Object.entries(out.verdict)) console.log(`${v.pass ? 'PASS' : 'FAIL'}  ${k} — ${v.detail}`);
}

function verdict(out) {
  const v = {};
  const bad = out.phases.flatMap((p) => Object.entries(p.endpoints).filter(([, e]) => e.validPct < 100).map(([ep, e]) => `${p.name}: ${ep} ${e.validPct}% ${JSON.stringify(e.mix)}`));
  v['100% HTTP 200 with a valid body, every endpoint, every window'] = { pass: bad.length === 0, detail: bad.length ? bad.slice(0, 6).join(' ; ') : 'all valid' };
  const k2 = out.phases.filter((p) => p.mode === 'ONGOING' && p.K === 2000 && p.endpoints[EP.results]);
  if (k2.length) v['p95 /api/results < 500 ms at K=2000 ONGOING'] = { pass: k2.every((p) => p.endpoints[EP.results].p95 < 500), detail: k2.map((p) => `${p.phase} p95 ${p.endpoints[EP.results].p95} ms`).join(', ') };
  const rv = out.phases.find((p) => p.reveal);
  if (rv) v['reveal seen by 95% of tabs within one ENDED poll (5 s) + 5 s'] = { pass: typeof rv.reveal.secondsAfterPressResponse.p95 === 'number' && rv.reveal.secondsAfterPressResponse.p95 <= 10, detail: `p50 ${rv.reveal.secondsAfterPressResponse.p50} s · p95 ${rv.reveal.secondsAfterPressResponse.p95} s · p100 ${rv.reveal.secondsAfterPressResponse.p100} s · ${rv.reveal.within10sPct}% within 10 s` };
  for (const mode of ['ONGOING', 'ENDED']) {
    const polls = out.phases.filter((p) => p.mode === mode && p.phase === 'poll');
    if (!polls.length) continue;
    const xs = polls.map((p) => p.db.xactPerSec);
    const spread = Math.max(...xs) - Math.min(...xs);
    const flat = polls.every((p) => p.resultsBuilds?.withinBound);
    v[`/api/results DB work flat across K (${mode}): builds ≤ window/4 s + 1`] = { pass: flat, detail: polls.map((p) => `K=${p.K}: ${p.db.xactPerSec} xact/s, ${p.db.tupReturnedPerSec} tup/s, ${p.resultsBuilds?.estimate} builds (bound ${p.resultsBuilds?.bound}) for ${p.resultsBuilds?.requestsServed} requests`).join(' · ') + ` · xact/s spread ${r1(spread)}` };
  }
  if (out.windowWarning) v['window ≥ 60 s'] = { pass: false, detail: out.windowWarning };
  return v;
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  const host = { cpus: os.cpus().length, model: os.cpus()[0].model, memGiB: +(os.totalmem() / 2 ** 30).toFixed(1), node: process.version, platform: `${os.platform()} ${os.release()}` };
  log(`host: ${JSON.stringify(host)}`);
  log(`db ${DB_NAME}; ONGOING ${ONGOING.join(',') || '-'} · ENDED ${ENDED.join(',') || '-'} · reveal ${REVEAL_K || '-'}; voters ${VOTERS} (voted ${VOTED}); window ${WINDOW_MS / 1000}s ramp ${RAMP_MS / 1000}s storm ${STORM_MS / 1000}s; home share ${HOME_SHARE}; admin tabs ${ADMIN_TABS}; trickle ${TRICKLE}/s; template ${TEMPLATE}; pool ${args.pool || 'prisma default'}; conn cap ${CONN || 'none'}`);
  if (!fs.existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'))) throw new Error('no production build (.next/BUILD_ID) — run `npm run build` first');
  const windowWarning = WINDOW_MS < 60_000 ? `window ${WINDOW_MS / 1000}s < 60 s: DB rates are not valid for the criteria (smoke run)` : null;

  const pg = new PrismaClient({ datasources: { db: { url: pgAdminUrl } } });
  const exists = await pg.$queryRawUnsafe('SELECT 1 FROM pg_database WHERE datname = $1', DB_NAME);
  if (!exists.length) await pg.$executeRawUnsafe(`CREATE DATABASE "${DB_NAME}"`);
  log('prisma db push → load DB');
  await run('npx', ['prisma', 'db', 'push', '--skip-generate'], { DATABASE_URL: dbUrl });

  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  const chainSecret = crypto.randomBytes(32).toString('hex');
  const db = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  await assertLoadDb(db);
  const fx = await seedFixture(db, keys, chainSecret);
  log(`fixture: ${VOTERS} eligible + 150 not eligible + admin; ${fx.chain.ballots} ballots on a verified chain`);

  const server = startServer({
    DATABASE_URL: serverUrl, E2E_MOCK_LOGIN: 'true', NEXTAUTH_URL: BASE, PORT: String(PORT),
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'), ADMIN_JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    ELECTION_BALLOT_PUBLIC_KEY: keys.publicKey, BALLOT_CHAIN_SECRET: chainSecret, BASE_PATH: '', NEXT_PUBLIC_BASE_PATH: '', ASSET_PREFIX: '',
  });
  const out = { host, db: DB_NAME, options: { ONGOING, ENDED, REVEAL_K, VOTERS, VOTED, WINDOW_MS, RAMP_MS, STORM_MS, HOME_SHARE, ADMIN_TABS, TRICKLE, TEMPLATE, pool: args.pool || null, conn: CONN || null }, windowWarning, phases: [] };
  const ctx = { pg, db, server, phases: out.phases, candidates: fx.candidates };
  try {
    await waitHealthy(server.child);
    const prov = await (await fetch(`${BASE}/api/auth/providers`)).json();
    if (!prov['mock-login']) throw new Error('mock-login provider not registered — is the server on the *_e2e DB?');
    const [{ n: backendsOnLoadDb }] = await pg.$queryRawUnsafe('SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = $1', DB_NAME);
    log(`server up on :${PORT} (pid ${server.child.pid}); mock-login registered; ${backendsOnLoadDb} backend(s) on ${DB_NAME}`);
    out.host.postgres = (await pg.$queryRawUnsafe('SHOW server_version'))[0].server_version;

    const t0 = Date.now();
    ctx.sessions = await mapLimit(fx.voted, 16, (s) => signIn(s));
    const trickleN = TRICKLE ? Math.min(fx.unvoted.length, Math.ceil(TRICKLE * (WINDOW_MS / 1000) * ONGOING.length) + 10) : 0;
    const trickleIds = fx.unvoted.slice(0, trickleN);
    ctx.trickle = (await mapLimit(trickleIds, 16, (s) => signIn(s))).map((cookie, i) => ({ cookie, studentId: trickleIds[i] }));
    ctx.adminCookie = await adminLogin();
    log(`signed in ${ctx.sessions.length} voted + ${ctx.trickle.length} trickle voters + admin in ${Date.now() - t0} ms (not measured)`);

    // warm every route once (first-hit module init is not what we measure)
    for (const u of ['/', '/results', '/api/results', '/api/check-status', '/api/admin/page-layout', '/api/check-form']) await fetch(BASE + u, { headers: { cookie: ctx.sessions[0] } }).then((r) => r.text());
    await sleep(FLUSH_MS);
    ctx.buildCal = await calibrate(ctx);
    out.calibration = ctx.buildCal;
    log(`calibration: ${JSON.stringify(ctx.buildCal)}`);

    for (const K of ONGOING) await runLevel(ctx, 'ONGOING', K);
    if (ENDED.length || REVEAL_K) {
      await adminAction(ctx.adminCookie, { action: 'SET_MODE', mode: 'ENDED' });
      await sleep(FLUSH_MS);
    }
    for (const K of ENDED) await runLevel(ctx, 'ENDED', K);
    if (REVEAL_K) await runReveal(ctx, REVEAL_K);

    // correctness after the night: chain still verifies with the trickle votes in,
    // and once revealed the public tally equals Candidate.score
    const chain = await verifyChain(db, chainSecret);
    out.chainAfter = { ok: chain.ok, counts: chain.counts };
    if (REVEAL_K) {
      await sleep(4100);
      const body = await (await fetch(`${BASE}/api/results`)).json();
      // multi-party ballot: the body lists the parties + งดออกเสียง; ไม่รับรอง (-1) is not on it
      const dbScores = await db.candidate.findMany({ where: { number: { gte: 0 } }, select: { id: true, score: true } });
      out.revealedTallyMatchesDb = body.isRevealed === true && body.candidates.length === dbScores.length && dbScores.every((c) => body.candidates.find((x) => x.id === c.id)?.score === c.score);
    }
    const errLines = server.lines.filter((x) => /error|P20\d\d|ECONN|timed out/i.test(x.l));
    out.serverErrorLines = errLines.length;
    out.serverErrorSample = errLines.slice(0, 8).map((x) => x.l.slice(0, 200));
  } finally {
    if (args['server-log']) fs.writeFileSync(args['server-log'], server.lines.map((x) => `${new Date(x.t).toISOString()} ${x.l}`).join('\n'));
    stopServer(server.child);
    await db.$disconnect();
    await sleep(1500);
    if (!args['keep-db']) {
      try { await pg.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${DB_NAME}" WITH (FORCE)`); log(`dropped ${DB_NAME}`); } catch (e) { log(`could not drop ${DB_NAME}: ${e.message}`); }
    }
    await pg.$disconnect();
  }

  out.verdict = verdict(out);
  out.verdict['ballot chain verifies after the run (fixture + trickle votes)'] = { pass: !!out.chainAfter?.ok, detail: JSON.stringify(out.chainAfter?.counts) };
  if ('revealedTallyMatchesDb' in out) out.verdict['revealed public tally == Candidate.score'] = { pass: out.revealedTallyMatchesDb, detail: String(out.revealedTallyMatchesDb) };
  out.verdict['no server error log lines'] = { pass: out.serverErrorLines === 0, detail: `${out.serverErrorLines} line(s)${out.serverErrorLines ? `: ${out.serverErrorSample.join(' | ')}` : ''}` };
  printReport(out);
  if (args.out) fs.writeFileSync(args.out, JSON.stringify(out, null, 2));
  if (!Object.values(out.verdict).every((x) => x.pass)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
