// scripts/audit/repro-http-01-live-app.mjs
//
//   1. start the app on the audit database:  node scripts/audit/start-audit-server.cjs
//   2. AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/repro-http-01-live-app.mjs
//
// Talks to the REAL routes over HTTP (default http://localhost:3210), as a
// student (dev-only mock login), as a committee admin (shared password) and as
// nobody. Each numbered check prints what was sent and what came back.
// Lines starting "FINDING" are behaviours a reader of the README would not
// expect; lines starting "OK" are claims that held.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { db, reset, castVote, loadState } = require("./lib/auditDb.cjs");

const BASE = process.env.AUDIT_BASE || "http://localhost:3210";
const SHARED_PW = "audit-shared-committee-password";
const out = [];
const say = (tag, msg) => { out.push([tag, msg]); console.log(`${tag.padEnd(8)} ${msg}`); };
const head = (t) => console.log(`\n── ${t}`);

class Jar {
  constructor() { this.c = new Map(); }
  take(res) { for (const sc of res.headers.getSetCookie?.() || []) { const [kv] = sc.split(";"); const i = kv.indexOf("="); const k = kv.slice(0, i), v = kv.slice(i + 1); if (v === "" || /Max-Age=0|1970/.test(sc)) this.c.delete(k); else this.c.set(k, v); } }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join("; "); }
}
async function call(jar, path, { method = "GET", json, form, headers = {} } = {}) {
  const h = { ...headers };
  if (jar?.c.size) h.cookie = jar.header();
  let body;
  if (json !== undefined) { h["content-type"] = "application/json"; body = JSON.stringify(json); }
  if (form !== undefined) { h["content-type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(form).toString(); }
  const res = await fetch(BASE + path, { method, headers: h, body, redirect: "manual" });
  jar?.take(res);
  const text = await res.text();
  let data = null; try { data = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, data, text };
}
async function studentLogin(studentId) {
  const jar = new Jar();
  const { data } = await call(jar, "/api/auth/csrf");
  await call(jar, "/api/auth/callback/mock-login", { method: "POST", form: { csrfToken: data.csrfToken, studentId, json: "true", callbackUrl: BASE + "/vote" } });
  const s = await call(jar, "/api/auth/session");
  if (s.data?.user?.studentId !== studentId) throw new Error(`mock login failed for ${studentId}: ${s.text.slice(0, 200)}`);
  return jar;
}
async function adminLogin(username, password = SHARED_PW) {
  const jar = new Jar();
  const r = await call(jar, "/api/admin/login", { method: "POST", json: { username, password } });
  return { jar, status: r.status };
}
const action = (jar, body) => call(jar, "/api/admin/dashboard", { method: "POST", json: body });
const tallyOf = (data) => (data?.candidates || []).map((c) => `${c.number}:${c.score}`).join(" ");

const c = db();
const state = loadState();

// ── seed ──────────────────────────────────────────────────────────────────────
const { candidates, users } = await reset({ voters: 30 });
const [abst, A, B] = candidates;
await c.systemConfig.update({ where: { id: 1 }, data: { adminPasswordHash: await bcrypt.hash(SHARED_PW, 10) } });
await c.user.createMany({ data: [
  { studentId: "audit-admin-1", name: "กรรมการ หนึ่ง", role: "student", isAdmin: true },
  { studentId: "audit-admin-2", name: "กรรมการ สอง", role: "student", isAdmin: true },
  { studentId: "audit-year5", name: "ไม่มีสิทธิ์", role: "student", year: "ปี 5" },
] });
// 12 honest votes straight into the box: A=7 B=4 abstain=1
for (let i = 0; i < 12; i++) await castVote(users[i].id, i < 7 ? A.id : i < 11 ? B.id : abst.id);
const sid = (i) => users[i].studentId;

// ── 1 one person, one vote, over HTTP ────────────────────────────────────────
head("1. one person one vote (README claim 1)");
{
  const jar = await studentLogin(sid(12));
  const rs = await Promise.all(Array.from({ length: 20 }, () => call(jar, "/api/vote", { method: "POST", json: { candidateId: A.id } })));
  const ok = rs.filter((r) => r.status === 200).length;
  const codes = Object.entries(rs.reduce((m, r) => { const k = `${r.status}${r.data?.code ? " " + r.data.code : ""}`; m[k] = (m[k] || 0) + 1; return m; }, {})).map(([k, v]) => `${k}×${v}`).join(", ");
  const again = await call(await studentLogin(sid(12)), "/api/vote", { method: "POST", json: { candidateId: B.id } });
  const u = await c.user.findUnique({ where: { studentId: sid(12) } });
  // the second attempt is refused either as ALREADY_VOTED (403) or by the 15/min throttle (429)
  say(ok === 1 && [403, 429].includes(again.status) && (await c.ballot.count()) === 13 ? "OK" : "FINDING", `20 simultaneous POST /api/vote from one session → ${codes}; second session of same student → ${again.status} ${again.data?.code}; ballots=${await c.ballot.count()} (expected 13)`);
  say("info", `stored votedAt=${u.votedAt.toISOString()} (floored to the hour)`);
  const body = await call(await studentLogin(sid(13)), "/api/vote", { method: "POST", json: { candidateId: A.id, studentId: sid(14) } });
  const v14 = await c.user.findUnique({ where: { studentId: sid(14) } });
  say(body.status === 200 && !v14.isVoted ? "OK" : "FINDING", `studentId in the request body is ignored: vote recorded for the session user, ${sid(14)} isVoted=${v14.isVoted}`);
}

// ── 2 eligibility ────────────────────────────────────────────────────────────
head("2. who may vote (README claim 7)");
{
  const r5 = await call(await studentLogin("audit-year5"), "/api/vote", { method: "POST", json: { candidateId: A.id } });
  say(r5.status === 403 ? "OK" : "FINDING", `student with year "ปี 5" → ${r5.status} ${r5.data?.code}`);
  const anon = await call(null, "/api/vote", { method: "POST", json: { candidateId: A.id } });
  say(anon.status === 401 ? "OK" : "FINDING", `no session → ${anon.status} ${anon.data?.code}`);
  const bad = await call(await studentLogin(sid(15)), "/api/vote", { method: "POST", json: { candidateId: 99999 } });
  say(bad.status === 400 ? "OK" : "FINDING", `unknown candidateId → ${bad.status} ${bad.data?.code}`);
  const prov = await call(null, "/api/auth/providers");
  say("info", `providers on this DEV server: ${Object.keys(prov.data || {}).join(", ")}  (mock-login must be absent on a production build — not testable from a dev server, see report)`);
}

// ── 3 embargo sweep ──────────────────────────────────────────────────────────
head("3. is any score visible before reveal? (README claim 5)  truth: A=8 B=4 abstain=1, showResult=false");
const admin1 = await adminLogin("audit-admin-1");
{
  const student = await studentLogin(sid(16));
  const truth = new Map((await c.candidate.findMany()).map((x) => [x.id, x.score]));
  const leaks = [];
  const scan = (who, path, r) => {
    const t = r.text;
    const hits = [...t.matchAll(/"score\\?":\s*(\d+)/g)].map((m) => Number(m[1])).filter((n) => n > 0);
    const hasKey = /"score\\?"/.test(t);
    console.log(`   ${who.padEnd(8)} ${String(r.status).padEnd(4)} ${path.padEnd(34)} score key: ${hasKey ? "present" : "absent "}  non-zero scores: ${hits.length ? hits.join(",") : "none"}`);
    if (hits.length) leaks.push(`${who} ${path}`);
  };
  const pub = ["/api/results", "/api/party", "/api/home-info", "/api/check-status", `/api/gallery?id=${A.id}`, "/api/health", "/", "/results", "/candidates", `/party?id=${A.id}`];
  for (const p of pub) scan("anon", p, await call(null, p));
  for (const p of ["/api/results", "/api/check-status", "/vote", "/results"]) scan("student", p, await call(student, p));
  const adm = ["/api/results", "/api/admin/dashboard", "/api/admin/members", "/api/admin/readiness", "/api/admin/global-config", "/api/admin/ballot-lock", "/api/admin/me", "/api/admin/templates", "/api/admin/page-layout", "/api/admin/test-tools"];
  for (const p of adm) scan("admin", p, await call(admin1.jar, p));
  say(leaks.length ? "FINDING" : "OK", leaks.length ? `score visible before reveal at: ${leaks.join("; ")}` : `no endpoint or page returned a non-zero score while showResult=false (${pub.length + 4 + adm.length} requests)`);
  const ar = await call(admin1.jar, "/api/results");
  say("info", `admin /api/results while sealed: tally ${tallyOf(ar.data)}; live turnout by group IS returned to admins: byYear=${JSON.stringify(ar.data?.stats?.byYear)}`);
  const pr = await call(null, "/api/results");
  say("info", `public /api/results while sealed: totalVotes=${pr.data?.totalVotes} (running turnout is public by design), breakdown rows=${pr.data?.stats?.byYear?.length}`);
  // page-layout GET is public on purpose (theme/layout only, the public pages read it)
  for (const p of adm.slice(1).filter((x) => x !== "/api/admin/page-layout")) { const r = await call(null, p); if (r.status !== 401) say("FINDING", `${p} without admin cookie → ${r.status}`); }
  say("OK", "every /api/admin/* GET above answers 401 without the admin cookie (except page-layout, public by design: layout and theme only)");
  // a PSU session of an isAdmin user, but no admin cookie
  const sso = await studentLogin("audit-admin-1");
  const r = await call(sso, "/api/admin/dashboard");
  say(r.status === 401 ? "OK" : "FINDING", `student-login session of an isAdmin user, no admin_token → /api/admin/dashboard ${r.status}`);
}

// ── 4 peek mid-election, then reopen ─────────────────────────────────────────
head("4. committee admin: close → publish → hide → reopen, mid-election");
{
  const steps = [
    ["SET_MODE ENDED", { action: "SET_MODE", mode: "ENDED" }],
    ["SET_SHOW_RESULT true", { action: "SET_SHOW_RESULT", value: true }],
  ];
  for (const [l, b] of steps) { const r = await action(admin1.jar, b); console.log(`   ${l} → ${r.status} ${r.data?.error || r.data?.message}`); }
  const seen = await call(null, "/api/results");
  console.log(`   anonymous GET /api/results now → isRevealed=${seen.data?.isRevealed} tally ${tallyOf(seen.data)}`);
  for (const [l, b] of [["SET_SHOW_RESULT false", { action: "SET_SHOW_RESULT", value: false }], ["SET_MODE MANUAL_OPEN", { action: "SET_MODE", mode: "MANUAL_OPEN" }]]) {
    const r = await action(admin1.jar, b); console.log(`   ${l} → ${r.status} ${r.data?.error || r.data?.message}`);
  }
  const v = await call(await studentLogin(sid(17)), "/api/vote", { method: "POST", json: { candidateId: B.id } });
  const peeked = (seen.data?.candidates || []).some((x) => x.score > 0);
  say(peeked && v.status === 200 ? "FINDING" : "OK", `tally was served to an anonymous caller mid-election (${peeked}), then the box reopened and took a new vote (HTTP ${v.status})`);
}

// ── 5 rename parties after ballots exist; nothing in the audit log ───────────
head("5. edit party identity after ballots are in the box");
{
  const before = await c.adminAuditLog.count();
  const put = (id, name) => { const fd = new FormData(); fd.set("name", name); return fetch(`${BASE}/api/admin/candidates?id=${id}`, { method: "PUT", body: fd, headers: { cookie: admin1.jar.header() } }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) })); };
  const r1 = await put(A.id, "tmp-swap");
  const r2 = await put(B.id, A.name);
  const r3 = await put(A.id, B.name);
  const num = await (() => { const fd = new FormData(); fd.set("number", "9"); return fetch(`${BASE}/api/admin/candidates?id=${A.id}`, { method: "PUT", body: fd, headers: { cookie: admin1.jar.header() } }).then((r) => r.status); })();
  const del = await fetch(`${BASE}/api/admin/candidates?id=${A.id}`, { method: "DELETE", headers: { cookie: admin1.jar.header() } }).then((r) => r.status);
  const now = await c.candidate.findMany({ where: { number: { gt: 0 } }, orderBy: { number: "asc" } });
  const after = await c.adminAuditLog.count();
  console.log(`   rename PUTs → ${r1.status}, ${r2.status}, ${r3.status};  change number → ${num};  delete party → ${del}`);
  console.log(`   before: เบอร์ 1 "${A.name}"  เบอร์ 2 "${B.name}"`);
  console.log(`   now   : ${now.map((x) => `เบอร์ ${x.number} "${x.name}" score=${x.score}`).join("   ")}`);
  say(num === 409 && del === 409 ? "OK" : "FINDING", `changing a party's number (${num}) and deleting a party (${del}) are refused once ballots exist`);
  const swapped = now[0].name === B.name && now[1].name === A.name;
  say(swapped ? "FINDING" : "OK", `the two parties' NAMES were swapped with ${now[0].score + now[1].score} ballots already cast (scores stay with the row); audit rows written for it: ${after - before}`);
  const keys = Object.keys(r3.data || {});
  say(keys.includes("score") ? "FINDING" : "OK", `PUT response ${keys.includes("score") ? "CONTAINS" : "does not contain"} score`);
  await put(A.id, "tmp-swap"); await put(B.id, B.name); await put(A.id, A.name); // restore
}

// ── 6 who is in the audit log ────────────────────────────────────────────────
head("6. audit log: who, and can it be relied on");
{
  // the person holding admin-1's seat signs in under admin-2's id with the same shared password
  const asOther = await adminLogin("audit-admin-2");
  await action(asOther.jar, { action: "SET_MODE", mode: "PAUSE" });
  await action(asOther.jar, { action: "SET_MODE", mode: "MANUAL_OPEN" });
  const rows = await c.adminAuditLog.findMany({ orderBy: { id: "asc" } });
  for (const r of rows) console.log(`   #${r.id} ${r.actor?.padEnd(14)} ${r.action.padEnd(16)} ${r.detail}`);
  say("FINDING", `login as "audit-admin-2" with the shared committee password → HTTP ${asOther.status}; the log attributes those actions to audit-admin-2. Any holder of the shared password can act under any committee member's id.`);
  const logins = rows.filter((r) => /LOGIN/i.test(r.action)).length;
  say(logins ? "OK" : "FINDING", `admin sign-ins recorded in the audit log: ${logins} (3 successful sign-ins and 0 failures so far in this run)`);
  const upd = await c.$executeRawUnsafe(`UPDATE "AdminAuditLog" SET actor = 'someone-else' WHERE id = ${rows[0].id}`);
  const del = await c.$executeRawUnsafe(`DELETE FROM "AdminAuditLog" WHERE id = ${rows[1].id}`);
  say("info", `on THIS database (no ballot-grants.sql applied, like any dev/e2e DB) the app's connection could UPDATE ${upd} and DELETE ${del} audit row(s). Append-only is a property of the production grants, not of the app — see report.`);
}

// ── 7 admin session lifetime ─────────────────────────────────────────────────
head("7. admin cookie");
{
  const a = await adminLogin("audit-admin-1");
  const token = a.jar.c.get("admin_token");
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  say("info", `admin_token lifetime ${(payload.exp - payload.iat) / 3600} h; claims: ${Object.keys(payload).join(", ")}`);
  await call(a.jar, "/api/admin/logout", { method: "POST" });
  const replay = new Jar(); replay.c.set("admin_token", token);
  const r = await call(replay, "/api/admin/dashboard");
  say(r.status === 200 ? "FINDING" : "OK", `after POST /api/admin/logout the same token still works → ${r.status} (logout only clears the browser cookie; a copied token lives until it expires)`);
  await c.systemConfig.update({ where: { id: 1 }, data: { adminPasswordHash: await bcrypt.hash("rotated-" + SHARED_PW, 10) } });
  const r2 = await call(replay, "/api/admin/dashboard");
  say(r2.status === 200 ? "FINDING" : "OK", `after the shared password is rotated the old token still works → ${r2.status}`);
  await c.user.update({ where: { studentId: "audit-admin-1" }, data: { isAdmin: false } });
  const r3 = await call(replay, "/api/admin/dashboard");
  say(r3.status === 403 ? "OK" : "FINDING", `after isAdmin is revoked in the DB the token is refused → ${r3.status}`);
  await c.user.update({ where: { studentId: "audit-admin-1" }, data: { isAdmin: true } });
  await c.systemConfig.update({ where: { id: 1 }, data: { adminPasswordHash: await bcrypt.hash(SHARED_PW, 10) } });
  const forged = new Jar(); forged.c.set("admin_token", token.slice(0, -3) + "abc");
  say((await call(forged, "/api/admin/dashboard")).status === 401 ? "OK" : "FINDING", "token with an altered signature is refused");
  const wrong = await adminLogin("audit-admin-1", "wrong");
  const nonAdmin = await adminLogin(sid(0));
  say(wrong.status === 401 && nonAdmin.status === 401 ? "OK" : "FINDING", `wrong password → ${wrong.status}; correct shared password but not an admin → ${nonAdmin.status}`);
}

// ── 8 CSRF ───────────────────────────────────────────────────────────────────
head("8. cross-site requests (README claim 8)");
{
  const s = await studentLogin(sid(18));
  const cases = [
    ["Origin: https://evil.psu.ac.th", { origin: "https://evil.psu.ac.th" }],
    ["Sec-Fetch-Site: same-site", { "sec-fetch-site": "same-site" }],
    ["Sec-Fetch-Site: cross-site", { "sec-fetch-site": "cross-site", origin: BASE }],
    ["Origin: null", { origin: "null" }],
    [`Origin: ${BASE}.evil.com`, { origin: `${BASE}.evil.com` }],
  ];
  let allRefused = true;
  const modeBefore = (await c.systemConfig.findUnique({ where: { id: 1 } })).systemMode;
  for (const [l, h] of cases) {
    const v = await call(s, "/api/vote", { method: "POST", json: { candidateId: A.id }, headers: h });
    const d = await call(admin1.jar, "/api/admin/dashboard", { method: "POST", json: { action: "SET_MODE", mode: "ENDED" }, headers: h });
    console.log(`   ${l.padEnd(40)} /api/vote → ${v.status} ${v.data?.code || ""}   /api/admin/dashboard → ${d.status} ${d.data?.code || ""}`);
    if (v.status !== 403 || d.status !== 403) allRefused = false;
  }
  const u = await c.user.findUnique({ where: { studentId: sid(18) } });
  const mode = (await c.systemConfig.findUnique({ where: { id: 1 } })).systemMode;
  say(allRefused && !u.isVoted && mode === modeBefore ? "OK" : "FINDING", `all cross-site variants refused; victim isVoted=${u.isVoted}, mode unchanged (${mode})`);
  const tp = await call(s, "/api/vote", { method: "POST", headers: { "content-type": "text/plain", origin: BASE }, });
  say(tp.status === 400 ? "OK" : "FINDING", `same-origin but Content-Type text/plain → ${tp.status}`);
}

// ── 9 login throttle ─────────────────────────────────────────────────────────
head("9. admin login throttle");
{
  const st = [];
  for (let i = 0; i < 12; i++) st.push((await call(null, "/api/admin/login", { method: "POST", json: { username: "audit-admin-1", password: "x" + i }, headers: { "x-forwarded-for": "203.0.113.9" } })).status);
  console.log(`   12 wrong passwords from one address → ${st.join(" ")}`);
  const st2 = [];
  for (let i = 0; i < 12; i++) st2.push((await call(null, "/api/admin/login", { method: "POST", json: { username: "audit-admin-1", password: "y" + i }, headers: { "x-forwarded-for": `198.51.100.${i + 1}` } })).status);
  console.log(`   12 more, each with a different X-Forwarded-For, sent straight to the app port → ${st2.join(" ")}`);
  say(st.includes(429) ? "OK" : "FINDING", "throttle engages after 10 attempts per address");
  say(st2.includes(429) ? "OK" : "info", "a client that reaches the app port directly chooses its own address and is never throttled — the limit depends on nginx being the only way in (not verifiable from here)");
}

// ── 10 leftover debug route in the working tree ──────────────────────────────
head("10. src/app/api/debug-db (untracked file in the working tree)");
{
  const r = await call(null, "/api/debug-db?key=admin123");
  console.log(`   GET /api/debug-db?key=admin123 → ${r.status} ${r.text.slice(0, 220).replace(/\s+/g, " ")}`);
  say(r.status === 200 ? "FINDING" : "info", r.status === 200 ? "answers with a hardcoded key and discloses database host/user/name" : "does not serve on this checkout (see report for why)");
}

// ── final consistency ────────────────────────────────────────────────────────
head("final state of the box after everything above");
{
  const { verifyChain } = require("../../src/lib/chainVerify");
  const v = await verifyChain(c, state.chainSecret);
  for (const k of v.checks) console.log(`   ${k.ok ? "PASS" : "FAIL"} ${k.name.padEnd(16)} ${k.detail}`);
  say(v.ok ? "OK" : "FINDING", "chain + counts consistent after the HTTP run");
}

console.log(`\n${out.filter(([t]) => t === "FINDING").length} FINDING line(s), ${out.filter(([t]) => t === "OK").length} OK line(s).`);
await c.$disconnect();
