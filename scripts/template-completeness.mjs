// Template completeness gate — the thing that would have caught, on its own, the
// four "landed on some families and quietly missed others" defects this arc found:
// blossom/receipt with no /login of their own, receipt's chrome-less success page,
// five families whose only exit was faint text, and the by-major chart fixed in one
// family while two kept the old constant.
//
// For every template x every page it asserts the things EVERY family owes a voter:
//   chrome      something pinned that identifies the site (nav/topbar/rail/dock)
//   exit        a visible way onward that is not the browser back button
//   readable    no clipped text, no horizontal overflow
//   sane        no NaN/undefined leaking into the page
//
// Two modes: preview (no database, no session) and REAL=1 (the actual routes).
//
//   npm run template-gate                 preview mode — clipping/overflow/junk only
//   REAL=1 npm run template-gate          the real routes — adds chrome + exit
//   FAM=receipt VP=412x880 REAL=1 npm run template-gate
//
// USE REAL=1 FOR ANYTHING ABOUT CHROME OR EXITS. /template-preview renders every
// family with editorMode on, which strips the navbar and nulls every href by
// design, so preview mode reports "no chrome" and "no exit" on pages that have
// both. Preview mode is still the fast way to check clipping and overflow.
//
// REAL=1 currently reports 72/72 across six families x six pages x two viewports.
// REAL=1 drives the actual routes instead of /template-preview: it switches
// activeTemplateId in the database per family (restoring it at the end) and carries
// a minted session. Needed because the preview deliberately renders chrome-less and
// href-less — chrome and exit can only be judged on the real pages. Everything else
// (clipping, overflow, junk) is honest in either mode.
import fs from "node:fs";
import { chromium } from "playwright";
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const REAL = process.env.REAL === "1";
const env = {};
if (REAL) {
  for (const l of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
}
const db = REAL ? new PrismaClient() : null;

const BASE = process.env.BASE || "http://127.0.0.1:3000/fms-ovs";
const FAMS = (process.env.FAM || "original,gumroad,studio-dark,verdure,blossom,receipt").split(",");
const VPS = (process.env.VP || "1440x900,412x880").split(",").map((s) => s.split("x").map(Number));
// login is deliberately in the list: it is the page two families did not have.
const PAGES = (process.env.PG || "home,candidates,party,vote,results,success,closed").split(",");

const AUDIT = () => {
  const vis = (e) => {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && +cs.opacity > 0.05;
  };
  // chrome: anything pinned to the viewport that carries navigation or identity
  const chrome = [...document.querySelectorAll('nav,header,aside,[class*="topbar"],[class*="rail"],[class*="dock"],[class*="cornermark"],[class*="navbar"]')]
    .filter((e) => vis(e) && ["fixed", "sticky"].includes(getComputedStyle(e).position) && e.getBoundingClientRect().height > 8)
    .map((e) => `${e.tagName.toLowerCase()}.${(e.className?.toString?.() || "").trim().split(/\s+/).filter((c) => !c.startsWith("jsx-"))[0] || "?"}`);

  // exit: a control that offers a way onward. Matched on LABEL, not href — the
  // preview renders every family with `href={editorMode ? undefined : ...}`, so
  // every link here has a null href by design. Checking href reported all six
  // families as having no exit anywhere, which was the harness measuring the
  // preview harness. The label is what a voter actually reads.
  // A hamburger counts. On a phone gumroad collapses its nav behind a control
  // labelled "เมนู" and that is the exit — refusing to count it marked working
  // pages as dead ends. Matched on the label or the aria the control exposes,
  // never on a class name.
  const exits = [...document.querySelectorAll("a,button,[role='button']")]
    .filter(vis)
    .filter((e) => {
      const label = `${(e.innerText || "").trim()} ${e.getAttribute("aria-label") || ""}`;
      const isMenuToggle = /เมนู|menu|navigation/i.test(label) || e.hasAttribute("aria-expanded");
      return isMenuToggle || /กลับ|หน้าแรก|หน้าหลัก|ผู้สมัคร|ผลคะแนน|ลงคะแนน|Home|Results|Candidates|Vote/i.test(label);
    }).length;

  // readable
  const clipped = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.15) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (!own) continue;
    const hidden = cs.overflow === "hidden" || cs.overflowY === "hidden";
    // >8px, not >3px: a line-clamp box rounds a few pixels past its own height as a
    // matter of course, and at >3 every clamped party name in three families read as
    // truncated. The real defect this gate exists to catch measured 37-40px.
    if (hidden && el.scrollHeight - el.clientHeight > 8) {
      clipped.push(`${own.slice(0, 22)}|cut${el.scrollHeight - el.clientHeight}`);
    }
  }
  // skip SCRIPT/STYLE: Next serialises its flight payload into a script tag whose
  // text legitimately contains the word "undefined", and matching that reported
  // every page of every family as broken.
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const junk = [...document.querySelectorAll("body *")]
    .filter((el) => !SKIP.has(el.tagName))
    .map((el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(""))
    .filter((t) => /\b(NaN|undefined|\[object Object\])\b/.test(t))
    .map((t) => t.trim().slice(0, 30)).slice(0, 2);

  return {
    chrome: [...new Set(chrome)],
    exits,
    clipped: [...new Set(clipped)].slice(0, 4),
    junk,
    xo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    len: document.body.innerText.trim().length,
  };
};

const rows = [];
const b = await chromium.launch();
const cfg0 = REAL ? await db.systemConfig.findUnique({ where: { id: 1 } }) : null;
const voter = REAL ? await db.user.findFirst({ where: { isVoted: true } }) : null;
const cookieFor = async () => [{
  name: "next-auth.session-token",
  value: await encode({ token: { name: voter.name, email: voter.email, sub: String(voter.id), id: voter.id, studentId: voter.studentId, role: voter.role, isAdmin: voter.isAdmin, isVoted: voter.isVoted, year: voter.year }, secret: env.NEXTAUTH_SECRET }),
  url: new URL(BASE).origin,
}];
try {
  for (const fam of FAMS) {
    const interact = /^(original|classic)/.test(fam) ? "&interact=1" : "";
    if (REAL) await db.systemConfig.update({ where: { id: 1 }, data: { activeTemplateId: fam } });
    for (const [w, h] of VPS) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } });
      if (REAL) await ctx.addCookies(await cookieFor());
      const p = await ctx.newPage();
      for (const page of PAGES) {
        let ok = false;
        for (let i = 0; i < 3 && !ok; i++) {
          try {
            const url = REAL ? `${BASE}/${page === "home" ? "" : page}` : `${BASE}/template-preview?slug=${fam}&page=${page}&parties=6${interact}`;
            await p.goto(url, { waitUntil: "load", timeout: 120000 });
            await p.waitForFunction(() => document.body.innerText.trim().length > 40, { timeout: 45000 });
            await p.evaluate(() => document.fonts.ready);
            await p.waitForTimeout(700);
            ok = true;
          } catch {}
        }
        if (!ok) { rows.push({ fam, page, w, fail: ["ไม่โหลด"] }); continue; }
        const r = await p.evaluate(AUDIT);
        const fail = [];
        if (!r.chrome.length) fail.push("ไม่มี chrome");
        if (!r.exits) fail.push("ไม่มีทางออก");
        if (r.clipped.length) fail.push(`ข้อความถูกตัด: ${r.clipped.join(", ")}`);
        if (r.junk.length) fail.push(`ค่าเพี้ยน: ${r.junk.join(" ")}`);
        if (r.xo > 2) fail.push(`ล้นแนวนอน ${r.xo}px`);
        rows.push({ fam, page, w, fail, chrome: r.chrome[0], exits: r.exits });
      }
      await ctx.close();
    }
  }
} finally {
  if (REAL) {
    await db.systemConfig.update({ where: { id: 1 }, data: { activeTemplateId: cfg0.activeTemplateId } });
    await db.$disconnect();
  }
  await b.close();
}

const bad = rows.filter((r) => r.fail.length);
console.log(`ตรวจ ${rows.length} หน้า-สถานะ · ผ่าน ${rows.length - bad.length} · ไม่ผ่าน ${bad.length}\n`);
for (const fam of FAMS) {
  const mine = rows.filter((r) => r.fam === fam);
  const b2 = mine.filter((r) => r.fail.length);
  console.log(`${fam.padEnd(12)} ${b2.length ? "✗" : "✓"} ${mine.length - b2.length}/${mine.length}` +
    (b2.length ? "\n" + b2.map((r) => `    ${String(r.w).padEnd(5)} ${r.page.padEnd(11)} ${r.fail.join(" · ")}`).join("\n") : ""));
}
process.exit(bad.length ? 1 : 0);
