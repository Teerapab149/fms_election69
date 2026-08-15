/**
 * scripts/preflight-year.js — READ-ONLY "is the system ready for a fresh election
 * year / go-live?" verifier (5-year-readiness Pillar 2.1, the "dry-run script").
 *
 * It does NOT mutate anything. It reads the DB + .env and reports PASS / WARN /
 * FAIL for each item on the go-live checklist (runbook §1 + PLAN §2A.4), so the
 * committee can confirm the annual reset was done right BEFORE opening the polls.
 *
 *   node scripts/preflight-year.js
 *
 * Exit code: 1 if any FAIL (blocks a CI/go-live gate), else 0. WARN never fails.
 *
 * Target "fresh year" state: systemMode=AUTO, showResult=false, no test parties,
 * ≥1 real party + งดออกเสียง, all scores 0, nobody isVoted, this year's dates set,
 * a voter roll imported, prod secrets present, mock-login OFF.
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const VALID_YEARS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];
const TEST_PARTY_RE = /ทดสอบ|test|temp|dummy|ตัวอย่าง/i;

function readEnv(file) {
  const out = {};
  try {
    const txt = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

const results = [];
const add = (status, label, detail = "") => results.push({ status, label, detail });

(async () => {
  const env = { ...readEnv(".env"), ...readEnv(".env.local") };
  const prisma = new PrismaClient();
  try {
    const cfg = (await prisma.systemConfig.findFirst({ where: { id: 1 } })) || {};
    const gc = cfg.globalConfig || {};
    const candidates = await prisma.candidate.findMany({
      select: { id: true, name: true, number: true, score: true },
      orderBy: { number: "asc" },
    });

    // ── System mode + reveal ────────────────────────────────────────────────
    const mode = cfg.systemMode || "AUTO";
    if (mode === "AUTO") add("PASS", "systemMode = AUTO", "scheduled by the dates below");
    else add("WARN", `systemMode = ${mode}`, "AUTO is the normal annual default (time-driven)");

    if (cfg.showResult) add("FAIL", "showResult = true", "results must be HIDDEN before/at go-live");
    else add("PASS", "showResult = false", "tally hidden until certification");

    if (gc.ballotsAnonymized)
      add("WARN", "ballotsAnonymized flag still true", "last year's flag — RESET_VOTES clears it");
    else add("PASS", "ballots not anonymized", "fresh");

    // ── Parties / ballot shape ──────────────────────────────────────────────
    const realParties = candidates.filter((c) => c.number > 0);
    const testParties = realParties.filter((c) => TEST_PARTY_RE.test(c.name));
    const abstain = candidates.find((c) => c.number === 0);
    const disapprove = candidates.find((c) => c.number === -1);

    if (testParties.length)
      add("FAIL", `${testParties.length} test party still present`, testParties.map((c) => `#${c.number} ${c.name}`).join(", "));
    else add("PASS", "no test parties", "");

    if (realParties.length === 0) add("FAIL", "no real party (number > 0)", "seed the real parties first");
    else add("PASS", `${realParties.length} real part${realParties.length === 1 ? "y" : "ies"}`, realParties.map((c) => `#${c.number} ${c.name}`).join(", "));

    if (!abstain) add("WARN", "no งดออกเสียง option (number 0)", "the abstain choice is usually required");
    else add("PASS", "งดออกเสียง present", "");

    if (realParties.length === 1 && !disapprove)
      add("WARN", "single-party ballot but no ไม่รับรอง (-1)", "single-party elections need the disapprove option");

    // ── Votes reset ─────────────────────────────────────────────────────────
    const scored = candidates.filter((c) => (c.score || 0) !== 0);
    if (scored.length) add("FAIL", "candidate scores not zeroed", scored.map((c) => `${c.name}=${c.score}`).join(", "));
    else add("PASS", "all candidate scores = 0", "");

    const votedCount = await prisma.user.count({ where: { isVoted: true, year: { in: VALID_YEARS } } });
    if (votedCount > 0) add("FAIL", `${votedCount} voters still flagged isVoted`, "RESET_VOTES not run");
    else add("PASS", "no voter flagged isVoted", "");

    // ── Voter roll ──────────────────────────────────────────────────────────
    const eligible = await prisma.user.count({ where: { year: { in: VALID_YEARS } } });
    if (eligible === 0) add("WARN", "no eligible voters (ปี 1-4) in the DB", "import this year's roll (scripts/import-students.js)");
    else add("PASS", `${eligible} eligible voters (ปี 1-4)`, "roll imported");

    // ── Election dates ──────────────────────────────────────────────────────
    const parse = (v) => (v ? new Date(v) : null);
    const cStart = parse(gc.campaignStartAt);
    const eStart = parse(gc.electionStartAt);
    const eEnd = parse(gc.electionEndAt);
    if (!gc.campaignStartAt || !gc.electionStartAt || !gc.electionEndAt) {
      add("WARN", "election dates not all set in admin", "blank = code defaults in electionConfig.js (fallback only)");
    } else if ([cStart, eStart, eEnd].some((d) => isNaN(d?.getTime()))) {
      add("FAIL", "election date is unparseable", `${gc.campaignStartAt} / ${gc.electionStartAt} / ${gc.electionEndAt}`);
    } else if (!(cStart <= eStart && eStart < eEnd)) {
      add("FAIL", "election dates out of order", "need campaign ≤ start < end");
    } else if (eEnd.getTime() < Date.now()) {
      add("WARN", "election end is in the PAST", "looks like last year's dates — set this year's");
    } else {
      add("PASS", "election dates set + ordered", `${eStart.toISOString().slice(0, 16)} → ${eEnd.toISOString().slice(0, 16)}`);
    }

    // ── Identity meta ───────────────────────────────────────────────────────
    if (gc.electionName || gc.electionNumber) add("PASS", "election identity set", `${gc.electionName || ""} (#${gc.electionNumber ?? "?"}, พ.ศ. ${gc.academicYearTh ?? "?"})`);
    else add("WARN", "election identity using code defaults", "set electionName/electionNumber/academicYearTh in ตั้งค่าทั่วไป");

    // ── Env / secrets (prod hygiene) ────────────────────────────────────────
    if (!env.NEXTAUTH_SECRET) add("FAIL", "NEXTAUTH_SECRET missing", "sessions can't be signed");
    else add("PASS", "NEXTAUTH_SECRET present", "");

    if (!env.ADMIN_JWT_SECRET) add("WARN", "ADMIN_JWT_SECRET not in .env", "admin cookie auth needs it (may be set in deploy env)");
    else add("PASS", "ADMIN_JWT_SECRET present", "");

    // Admin access = a flagged row + the shared password (RUNBOOK §10). Both live
    // in the DB now, so check the DB, not the env.
    const cfgRow = await prisma.systemConfig.findFirst({ where: { id: 1 }, select: { adminPasswordHash: true } });
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { studentId: true, passwordHash: true, role: true } });
    if (!cfgRow?.adminPasswordHash) add("FAIL", "no shared admin password set", "run: node scripts/admin.js --rotate-password");
    else add("PASS", "shared admin password set", "bcrypt hash in SystemConfig");

    if (!admins.length) add("FAIL", "nobody has admin", "run: node scripts/admin.js --grant <studentId>");
    else add("PASS", `${admins.length} admin account(s)`, admins.map((a) => a.studentId).join(", "));

    // Staff accounts are SUPPOSED to hold their own password — that is what makes
    // a certified result attributable to a person instead of to whoever knew the
    // shared committee password. Warning about them here told the reader to run
    // --clear-personal, which would hand the signature back to the whole
    // committee. Only committee accounts are meant to share.
    const staff = admins.filter((a) => a.role === "STAFF" && a.passwordHash);
    const personal = admins.filter((a) => a.role !== "STAFF" && a.passwordHash);
    if (personal.length) add("WARN", `${personal.length} committee admin(s) still have a personal password`, `only break-glass and staff accounts should — clear with --clear-personal: ${personal.map((a) => a.studentId).join(", ")}`);
    else add("PASS", "no leftover personal admin passwords", "");
    if (staff.length) add("PASS", `${staff.length} staff account(s) with their own password`, `can certify results: ${staff.map((a) => a.studentId).join(", ")}`);

    if (env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN === "true") add("FAIL", "mock-login is ENABLED", "NEXT_PUBLIC_ENABLE_MOCK_LOGIN must be off in production");
    else add("PASS", "mock-login disabled", "");

    // ── Can the app actually create a party? (the 2569 production failure) ──────
    // Adding a party from the admin console died on the real server while deleting
    // worked, because INSERT on a SERIAL id needs USAGE on the sequence and only
    // the table grant had been given. Nothing in the UI or the logs said "sequence".
    // Probe it for real, inside a transaction that always rolls back, so this is
    // caught here instead of by a student the week before the election.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `INSERT INTO "Candidate" (name, number) VALUES ('__preflight probe__', -9999)`
        );
        throw new Error("__rollback__");
      });
    } catch (e) {
      if (e.message === "__rollback__" || e.message?.includes("__rollback__")) {
        add("PASS", "app can create parties/members", "insert probe succeeded (rolled back)");
      } else if (/permission denied for sequence/i.test(e.message)) {
        add("FAIL", "app CANNOT create parties — sequence grant missing",
          "the admin console will fail to add a party while delete still works · fix: psql -f scripts/sql/ballot-grants.sql (GRANT USAGE, SELECT ON ALL SEQUENCES)");
      } else if (/permission denied/i.test(e.message)) {
        add("FAIL", "app CANNOT create parties — grant missing", `${e.message.split("\n")[0]} · fix: psql -f scripts/sql/ballot-grants.sql`);
      } else {
        add("WARN", "could not probe party creation", e.message.split("\n")[0]);
      }
    }

    // ── Can the app DELETE a ballot? It must not be able to. ───────────────────
    // The whole tamper-evidence story rests on the app role holding SELECT and
    // INSERT on "Ballot" and nothing more, so a compromised app cannot rewrite
    // the box. That depends entirely on whoever deployed it: creating fms_app,
    // pointing DATABASE_URL at it, and applying ballot-grants.sql. Miss any of
    // the three — point DATABASE_URL at the postgres superuser, say, which is
    // what the local compose file does — and nothing anywhere says so. Every
    // check passes, the election runs, and the guarantee quietly is not there.
    // Probe it: the delete below matches no rows and is rolled back regardless;
    // only the privilege matters.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`DELETE FROM "Ballot" WHERE false`);
        throw new Error("__rollback__");
      });
      add("FAIL", "app CAN delete ballots", "least-privilege is NOT in effect — the app role holds DELETE on \"Ballot\"");
    } catch (e) {
      if (/permission denied/i.test(e.message)) {
        add("PASS", "app cannot delete ballots", "least-privilege in effect (SELECT/INSERT only)");
      } else if (e.message === "__rollback__" || e.message?.includes("__rollback__")) {
        add("FAIL", "app CAN delete ballots",
          "least-privilege is NOT in effect · DATABASE_URL likely points at a superuser instead of fms_app · fix: create the fms_app role, apply scripts/sql/ballot-grants.sql, and repoint DATABASE_URL (STAFF-IT-GUIDE §3.0)");
      } else {
        add("WARN", "could not probe ballot delete privilege", e.message.split("\n")[0]);
      }
    }

    const leftover = await prisma.candidate.count({ where: { name: "__preflight probe__" } });
    if (leftover > 0) add("FAIL", "preflight probe row was not rolled back", `delete it by hand: name = '__preflight probe__'`);
  } catch (e) {
    add("FAIL", "preflight crashed", e.message);
  } finally {
    await prisma.$disconnect();
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const icon = { PASS: "✓", WARN: "⚠", FAIL: "✗" };
  console.log("\n  Election preflight — fresh-year / go-live readiness\n");
  for (const r of results) {
    console.log(`  ${icon[r.status]} [${r.status}] ${r.label}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  const fails = results.filter((r) => r.status === "FAIL").length;
  const warns = results.filter((r) => r.status === "WARN").length;
  console.log("");
  if (fails) console.log(`  ✗ NOT READY — ${fails} blocking issue(s), ${warns} warning(s). Fix the FAILs before go-live.\n`);
  else if (warns) console.log(`  ⚠ READY WITH WARNINGS — 0 blocking, ${warns} warning(s) to review.\n`);
  else console.log("  ✓ READY — all checks passed.\n");

  process.exitCode = fails ? 1 : 0;
})();
