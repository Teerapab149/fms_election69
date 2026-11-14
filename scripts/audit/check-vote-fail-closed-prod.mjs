// scripts/audit/check-vote-fail-closed-prod.mjs
//
//   npm run build
//   AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/check-vote-fail-closed-prod.mjs
//
// README claim 3: "if the ballot keys on the server are incomplete, the system
// stops taking votes". Starts the production build three times — no public key,
// no chain secret, both present — signs a student in and posts a vote each time.
// With a key missing the answer must be 503 and NOTHING may be written.
//
// Student sign-in on a production build uses the project's own e2e switch
// (E2E_MOCK_LOGIN=true + a database whose name ends in _e2e, see src/lib/auth.js);
// a real deployment satisfies neither.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const require = createRequire(import.meta.url);
const { db, reset, auditUrl, loadState } = require("./lib/auditDb.cjs");

const DIST = process.env.NEXT_DIST_DIR || ".next";
const PORT = process.env.AUDIT_PORT || "3230";
const BASE = `http://localhost:${PORT}`;
const state = loadState();
if (!/_e2e$/.test(new URL(auditUrl()).pathname)) { console.error("this check needs an audit database whose name ends in _e2e"); process.exit(1); }
const standaloneDir = [path.join(process.cwd(), DIST, "standalone"), path.join(process.cwd(), DIST, "standalone", path.basename(process.cwd()))]
  .find((d) => fs.existsSync(path.join(d, "server.js")));
const argv = process.env.AUDIT_USE_NEXT_START === "1" || !standaloneDir
  ? ["node_modules/next/dist/bin/next", "start", "-p", PORT, "-H", "127.0.0.1"]
  : [path.join(standaloneDir, "server.js")];

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); };
const c = db();

async function round(label, keys, expectStatus) {
  const { candidates, users } = await reset({ voters: 3 });
  const child = spawn(process.execPath, argv, {
    env: {
      ...process.env, NODE_ENV: "production", PORT, HOSTNAME: "127.0.0.1", NEXT_DIST_DIR: DIST,
      DATABASE_URL: auditUrl(), NEXTAUTH_URL: BASE, E2E_MOCK_LOGIN: "true",
      BASE_PATH: "", NEXT_PUBLIC_BASE_PATH: "", ASSET_PREFIX: "", ADMIN_TEST_TOOLS: "",
      NEXTAUTH_SECRET: crypto.randomBytes(24).toString("hex"), ADMIN_JWT_SECRET: crypto.randomBytes(24).toString("hex"),
      ELECTION_BALLOT_PUBLIC_KEY: keys.pub ? state.publicKey.replace(/\n/g, "\\n") : "",
      BALLOT_CHAIN_SECRET: keys.secret ? state.chainSecret : "",
    },
    stdio: "ignore",
  });
  try {
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch {}
      if (i === 59) throw new Error("server did not become healthy");
      await new Promise((r) => setTimeout(r, 1000));
    }
    const csrf = await fetch(`${BASE}/api/auth/csrf`);
    let jar = csrf.headers.getSetCookie().map((x) => x.split(";")[0]);
    const { csrfToken } = await csrf.json();
    const cb = await fetch(`${BASE}/api/auth/callback/mock-login`, {
      method: "POST", redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar.join("; ") },
      body: new URLSearchParams({ csrfToken, studentId: users[0].studentId, json: "true", callbackUrl: BASE }),
    });
    jar = jar.concat(cb.headers.getSetCookie().map((x) => x.split(";")[0]));
    const v = await fetch(`${BASE}/api/vote`, {
      method: "POST", headers: { "content-type": "application/json", cookie: jar.join("; "), origin: BASE },
      body: JSON.stringify({ candidateId: candidates[1].id }),
    });
    const body = await v.json().catch(() => ({}));
    const ballots = await c.ballot.count();
    const voted = await c.user.count({ where: { isVoted: true } });
    const score = (await c.candidate.aggregate({ _sum: { score: true } }))._sum.score;
    const wrote = expectStatus === 200 ? 1 : 0;
    ok(v.status === expectStatus && ballots === wrote && voted === wrote && score === wrote,
      `${label}: POST /api/vote → ${v.status} ${body.code || ""}; ballots=${ballots} voted=${voted} sum(score)=${score}`);
  } finally {
    child.kill();
    await new Promise((r) => setTimeout(r, 1500));
  }
}

await round("no ELECTION_BALLOT_PUBLIC_KEY", { pub: false, secret: true }, 503);
await round("no BALLOT_CHAIN_SECRET       ", { pub: true, secret: false }, 503);
await round("both keys present            ", { pub: true, secret: true }, 200);
await c.$disconnect();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
