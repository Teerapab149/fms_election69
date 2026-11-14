// scripts/audit/check-personal-passwords.mjs
//
//   1. node scripts/audit/start-audit-server.cjs          (app on the audit database)
//   2. AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/check-personal-passwords.mjs
//
// The rest of audit finding F7: with one shared committee password, anyone who
// holds it can sign in under any member's id, so the audit log's "who" is only
// what was typed. This drives the real scripts/admin.js commands and the real
// /api/admin/login to show the way out:
//
//   --set-password <id>   that account gets its own password and stops taking the shared one
//   --disable-shared      refused until every committee account has one, then switches the shared one off
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { db, reset, auditUrl } = require("./lib/auditDb.cjs");

const BASE = process.env.AUDIT_BASE || "http://localhost:3210";
const SHARED = "audit-shared-committee-password";
let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); };

const admin = (...args) => {
  const r = spawnSync(process.execPath, ["scripts/admin.js", ...args], { env: { ...process.env, DATABASE_URL: auditUrl() }, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
};
const passwordFrom = (out) => /Password\s+(\S+)/.exec(out)?.[1];
let ipSeq = 0;
async function login(username, password) {
  // a fresh client address per attempt, so the 10 per 5 minutes limiter stays out of the way
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `192.0.2.${++ipSeq}` },
    body: JSON.stringify({ username, password }),
  });
  const cookie = (res.headers.getSetCookie().find((x) => x.startsWith("admin_token=")) || "").split(";")[0];
  return { status: res.status, cookie };
}
const dash = async (cookie) => (await fetch(`${BASE}/api/admin/dashboard`, { headers: { cookie } })).status;

const c = db();
await reset({ voters: 2 });
await c.systemConfig.update({ where: { id: 1 }, data: { adminPasswordHash: await bcrypt.hash(SHARED, 10) } });
await c.user.createMany({ data: [
  { studentId: "member-a", name: "กรรมการ เอ", role: "student", isAdmin: true },
  { studentId: "member-b", name: "กรรมการ บี", role: "student", isAdmin: true },
] });

// before: the shared password opens either account
const a0 = await login("member-a", SHARED);
ok(a0.status === 200 && (await login("member-b", SHARED)).status === 200, "shared password opens both committee accounts (the starting point)");

// member A gets a password of their own
const set = admin("--set-password", "member-a");
const pwA = passwordFrom(set.out);
ok(set.code === 0 && !!pwA, `admin.js --set-password member-a → exit ${set.code}, a password is shown once`);
ok((await login("member-a", SHARED)).status === 401, "member-a no longer accepts the shared password (nobody else can sign in as A)");
const a1 = await login("member-a", pwA);
ok(a1.status === 200, "member-a signs in with their own password");
ok((await dash(a0.cookie)) === 401, "the session member-a opened earlier with the shared password is ended");
ok((await dash(a1.cookie)) === 200, "the new session works");

// the shared password cannot be switched off while B depends on it
const early = admin("--disable-shared");
ok(early.code === 1 && /member-b/.test(early.out), `--disable-shared is refused while member-b has no password of their own → exit ${early.code}`);
ok((await login("member-b", SHARED)).status === 200, "…and member-b can still sign in");

// B gets one, then the shared password goes
const pwB = passwordFrom(admin("--set-password", "member-b").out);
const off = admin("--disable-shared");
ok(off.code === 0, `--disable-shared now succeeds → exit ${off.code}`);
ok((await login("member-b", SHARED)).status === 401 && (await login("member-a", SHARED)).status === 401, "the old shared password opens nothing");
ok((await login("member-b", pwB)).status === 200, "member-b signs in with their own password");
ok((await login("member-a", pwB)).status === 401, "member-b's password does not open member-a's account");

// what the audit log now says
const rows = await c.adminAuditLog.findMany({ where: { action: "ADMIN_LOGIN" }, orderBy: { id: "asc" } });
const okRows = rows.filter((r) => JSON.parse(r.detail).result === "ok").length;
// 9 attempts above: 5 that should succeed, 4 that should be refused
ok(rows.length === 9 && okRows === 5,`every sign-in attempt is in the audit log: ${rows.length} rows, ${okRows} successful`);
const list = admin("--list");
ok(/ปิดอยู่ ทุกบัญชีเข้าด้วยรหัสของตัวเอง/.test(list.out), "--list reports the shared password as off");

await c.$disconnect();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
