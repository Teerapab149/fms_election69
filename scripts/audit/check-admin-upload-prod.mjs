// scripts/audit/check-admin-upload-prod.mjs
//
//   npm run build                       (or NEXT_DIST_DIR=<dir> npm run build)
//   AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/check-admin-upload-prod.mjs
//
// Deploy-readiness check for "the committee can upload pictures from the admin
// console". It starts the PRODUCTION standalone server the way the faculty
// machine runs it without Docker (node <dist>/standalone/server.js,
// NODE_ENV=production) with UPLOAD_ROOT pointing OUTSIDE the source tree, then
// signs in as an admin and uploads every kind of picture the console has:
// party logo, cover, group photos, mobile hero, member photo, member modal
// photo, and the election poster. For each it checks the file landed under
// UPLOAD_ROOT (not under the build), and that the public URL serves it at once,
// with no restart. It also checks what must be refused.
//
// Uses the audit's throwaway database only (lib/auditDb.cjs guard).
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const { db, reset, auditUrl, loadState } = require("./lib/auditDb.cjs");

const DIST = process.env.NEXT_DIST_DIR || ".next";
const PORT = process.env.AUDIT_PORT || "3220";
const BASE = `http://localhost:${PORT}`;
// Next nests the output under the project folder name when it finds a lockfile in a
// PARENT directory (it takes that as the workspace root). Accept both layouts.
const standaloneDir = [path.join(process.cwd(), DIST, "standalone"), path.join(process.cwd(), DIST, "standalone", path.basename(process.cwd()))]
  .find((d) => fs.existsSync(path.join(d, "server.js"))) || path.join(process.cwd(), DIST, "standalone");
const serverJs = path.join(standaloneDir, "server.js");
if (!fs.existsSync(serverJs)) { console.error(`no production build at ${serverJs} — run npm run build first`); process.exit(1); }

const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fms-upload-root-"));
const state = loadState();
const PW = "upload-check-shared-password";
let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); };

// seed
const c = db();
await reset({ voters: 4 });
await c.systemConfig.update({ where: { id: 1 }, data: { adminPasswordHash: await bcrypt.hash(PW, 10), systemMode: "PAUSE" } });
await c.user.create({ data: { studentId: "upload-admin", name: "กรรมการ ทดสอบอัปโหลด", role: "student", isAdmin: true } });

// start the production server
// AUDIT_USE_NEXT_START=1 serves the same production build through `next start`
// instead of the standalone server.js (for a machine where the standalone copy is
// incomplete, e.g. a parent-folder lockfile on a dev PC).
const argv = process.env.AUDIT_USE_NEXT_START === "1"
  ? ["node_modules/next/dist/bin/next", "start", "-p", PORT, "-H", "127.0.0.1"]
  : [serverJs];
const child = spawn(process.execPath, argv, {
  env: {
    ...process.env, NODE_ENV: "production", PORT, NEXT_DIST_DIR: DIST, HOSTNAME: "127.0.0.1",
    DATABASE_URL: auditUrl(), UPLOAD_ROOT: uploadRoot, NEXTAUTH_URL: BASE,
    BASE_PATH: "", NEXT_PUBLIC_BASE_PATH: "", ASSET_PREFIX: "", ADMIN_TEST_TOOLS: "",
    NEXTAUTH_SECRET: crypto.randomBytes(24).toString("hex"), ADMIN_JWT_SECRET: crypto.randomBytes(24).toString("hex"),
    ELECTION_BALLOT_PUBLIC_KEY: state.publicKey.replace(/\n/g, "\\n"), BALLOT_CHAIN_SECRET: state.chainSecret,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = ""; child.stdout.on("data", (d) => { log += d; }); child.stderr.on("data", (d) => { log += d; });
const stop = () => { try { child.kill(); } catch {} };
process.on("exit", stop);

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch {}
    if (i === 59) throw new Error("server did not become healthy:\n" + log.slice(-1500));
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`production server up on ${BASE}, UPLOAD_ROOT=${uploadRoot}\n`);

  const png = (w, h, color) => sharp({ create: { width: w, height: h, channels: 4, background: color } }).png().toBuffer();
  const jpg = (w, h, color) => sharp({ create: { width: w, height: h, channels: 3, background: color } }).jpeg().toBuffer();
  const file = (buf, name, type) => new File([buf], name, { type });

  // admin sign-in (the cookie is Secure in production; we carry it by hand over http://localhost)
  const lr = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "upload-admin", password: PW }) });
  const setCookie = lr.headers.getSetCookie().find((x) => x.startsWith("admin_token=")) || "";
  const cookie = setCookie.split(";")[0];
  ok(lr.status === 200 && /HttpOnly/i.test(setCookie) && /Secure/i.test(setCookie) && /SameSite=strict/i.test(setCookie), `admin login 200; cookie flags: ${setCookie.split(";").slice(1).map((s) => s.trim()).join(", ")}`);
  const H = { cookie, origin: BASE };

  const served = async (url) => {
    const r = await fetch(BASE + url);
    const buf = Buffer.from(await r.arrayBuffer());
    const onDisk = fs.existsSync(path.join(uploadRoot, url.replace(/^\/images\//, "")));
    return { status: r.status, type: r.headers.get("content-type"), bytes: buf.length, onDisk, magic: buf.subarray(8, 12).toString("latin1") };
  };
  const checkImg = async (label, url) => {
    if (!url) return ok(false, `${label}: no URL came back`);
    const s = await served(url);
    ok(s.status === 200 && s.type === "image/webp" && s.magic === "WEBP" && s.onDisk, `${label}: ${url} → ${s.status} ${s.type} ${s.bytes} B, under UPLOAD_ROOT: ${s.onDisk}`);
  };

  // 1. create a party with every picture slot filled
  const fd = new FormData();
  fd.set("name", "พรรคทดสอบอัปโหลด"); fd.set("number", "7"); fd.set("slogan", "ทดสอบ"); fd.set("color", "#8A2680");
  fd.set("members", JSON.stringify([{ name: "สมาชิก หนึ่ง", studentId: "6812345678", position: "นายกสโมสรนักศึกษา", major: "บัญชี" }]));
  fd.set("file", file(await png(900, 900, { r: 138, g: 38, b: 128, alpha: 0.5 }), "logo.png", "image/png"));
  fd.set("officialImage", file(await jpg(2400, 1350, { r: 20, g: 90, b: 160 }), "cover.jpg", "image/jpeg"));
  fd.append("groupFiles", file(await jpg(3000, 2000, { r: 200, g: 60, b: 60 }), "group1.jpg", "image/jpeg"));
  fd.append("groupFiles", file(await jpg(3000, 2000, { r: 60, g: 200, b: 60 }), "group2.jpg", "image/jpeg"));
  fd.append("mobileHeroFiles", file(await jpg(1080, 1920, { r: 60, g: 60, b: 200 }), "hero.jpg", "image/jpeg"));
  fd.set("member_file_6812345678", file(await jpg(2000, 3000, { r: 240, g: 200, b: 40 }), "member.jpg", "image/jpeg"));
  fd.set("member_modal_file_6812345678", file(await jpg(2000, 3000, { r: 40, g: 200, b: 240 }), "modal.jpg", "image/jpeg"));
  const cr = await fetch(`${BASE}/api/admin/candidates`, { method: "POST", body: fd, headers: H });
  const party = await cr.json();
  ok(cr.status === 200 && party.id, `create party with 7 pictures → ${cr.status}${party.error ? " " + party.error : ""}`);
  await checkImg("logo", party.logoUrl);
  await checkImg("cover (officialImage)", party.officialImageUrl);
  for (const [i, u] of (party.groupImageUrls || []).entries()) await checkImg(`group photo ${i + 1}`, u);
  ok((party.groupImageUrls || []).length === 2, `two group photos stored (${(party.groupImageUrls || []).length})`);
  await checkImg("mobile hero", (party.mobileHeroImage || [])[0]);
  await checkImg("member photo", party.members?.[0]?.imageUrl);
  await checkImg("member modal photo", party.members?.[0]?.modalImageUrl);

  // 2. replace the logo: new URL, served at once, old file removed? (logo is not cleaned up by PUT — report only)
  const fd2 = new FormData(); fd2.set("name", "พรรคทดสอบอัปโหลด");
  fd2.set("file", file(await png(500, 500, { r: 0, g: 0, b: 0, alpha: 1 }), "logo2.png", "image/png"));
  const up = await (await fetch(`${BASE}/api/admin/candidates?id=${party.id}`, { method: "PUT", body: fd2, headers: H })).json();
  ok(up.logoUrl && up.logoUrl !== party.logoUrl, `replace logo → new URL ${up.logoUrl}`);
  await checkImg("replaced logo", up.logoUrl);

  // 3. election poster
  const fb = new FormData(); fb.set("file", file(await jpg(2000, 1000, { r: 250, g: 250, b: 250 }), "poster.jpg", "image/jpeg"));
  const br = await fetch(`${BASE}/api/admin/global-config/banner`, { method: "POST", body: fb, headers: H });
  const banner = await br.json();
  ok(br.status === 200, `election poster upload → ${br.status}`);
  await checkImg("election poster", banner.url);

  // 4. the public party API hands out those URLs
  const pub = await (await fetch(`${BASE}/api/party`)).json();
  ok(pub.some((p) => p.logoUrl === up.logoUrl), "public /api/party returns the uploaded logo URL");

  // 5. refusals
  const bad = new FormData(); bad.set("name", "x"); bad.set("file", file(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"), "x.png", "image/png"));
  const r1 = await fetch(`${BASE}/api/admin/candidates?id=${party.id}`, { method: "PUT", body: bad, headers: H });
  ok(r1.status === 400, `SVG renamed to .png is refused → ${r1.status} ${(await r1.json()).error}`);
  const exe = new FormData(); exe.set("file", file(Buffer.from("MZ" + "\0".repeat(200)), "poster.jpg", "image/jpeg"));
  const r2 = await fetch(`${BASE}/api/admin/global-config/banner`, { method: "POST", body: exe, headers: H });
  ok(r2.status === 400, `non-image bytes labelled image/jpeg are refused → ${r2.status}`);
  const r3 = await fetch(`${BASE}/api/admin/global-config/banner`, { method: "POST", body: fb, headers: { origin: BASE } });
  ok(r3.status === 401, `upload without the admin cookie → ${r3.status}`);
  const r4 = await fetch(`${BASE}/api/admin/global-config/banner`, { method: "POST", body: fb, headers: { cookie, origin: "https://evil.psu.ac.th" } });
  ok(r4.status === 403, `upload from another origin with a valid admin cookie → ${r4.status}`);
  const big = new FormData(); big.set("file", file(Buffer.alloc(9 * 1024 * 1024, 1), "big.jpg", "image/jpeg"));
  const r5 = await fetch(`${BASE}/api/admin/global-config/banner`, { method: "POST", body: big, headers: H });
  ok(r5.status === 400, `9 MB poster (limit 8 MB) → ${r5.status}`);
  const trav = await fetch(`${BASE}/images/..%2F..%2Fpackage.json`);
  ok(trav.status === 404, `path traversal on /images → ${trav.status}`);

  // 6. readiness card
  const rd = await (await fetch(`${BASE}/api/admin/readiness`, { headers: H })).json();
  const upl = rd.checks.find((x) => x.id === "env.uploads");
  ok(upl?.level === "pass", `readiness "โฟลเดอร์เก็บรูปที่อัปโหลด" → ${upl?.level}: ${upl?.detail}`);
  const mock = rd.checks.find((x) => x.id === "env.mock");
  ok(mock?.level === "pass", `readiness mock login on a production build → ${mock?.level}`);
  const prov = await (await fetch(`${BASE}/api/auth/providers`)).json();
  ok(!("mock-login" in prov), `providers on the production build: ${Object.keys(prov).join(", ")}`);

  // 7. nothing was written inside the build
  const logoName = path.basename(up.logoUrl || "none");
  const strays = [path.join(process.cwd(), "public", "images", "candidates", "logo", logoName), path.join(standaloneDir, "public", "images", "candidates", "logo", logoName)].filter((p) => fs.existsSync(p));
  ok(strays.length === 0, "the uploaded logo exists only under UPLOAD_ROOT, not in public/ or in the build");
  const count = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
  console.log(`\nfiles under UPLOAD_ROOT: ${count(uploadRoot)}`);
} finally {
  stop();
  await c.$disconnect();
  fs.rmSync(uploadRoot, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
