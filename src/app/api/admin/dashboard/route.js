import { randomInt } from "node:crypto";
import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { adminGuard, requireAdmin } from "../../../../lib/auth/adminCheck";
import { isMockLoginProviderRegistered } from "../../../../lib/auth";
import { syncCandidateSpecialOptions } from "../../../../lib/candidates/specialOptions.mjs";
import { resolveElectionDates } from "../../../../utils/electionConfig";
import { isBoxClosed, checkSetMode, checkShowResult } from "../../../../lib/election/adminGuards.mjs";
import { bustResultsSnap } from "../../../../lib/election/resultsCache.mjs";
import { normalizeFormUrl, FORM_URL_ERROR } from "../../../../lib/forms/formUrl.mjs";

// Mode and result visibility are checked against each other (adminGuards), so
// they are read and written under a row lock: two admins pressing "reopen" and
// "publish" at the same moment must not each pass against the old row.
async function lockedConfig(tx) {
  await tx.$queryRaw`SELECT id FROM "SystemConfig" WHERE id = 1 FOR UPDATE`;
  return tx.systemConfig.findUnique({ where: { id: 1 } });
}
class GuardError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}

// 1. GET: ดึงข้อมูลสรุป (Dashboard Stats)
export async function GET(req) {
  const authError = await adminGuard(req);
  if (authError) return authError;
  try {
    // ดึงจำนวนคนทั้งหมด / คนที่โหวตแล้ว
    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    const totalEligible = await db.user.count({ where: { year: { in: validYears } } });
    const totalVoters = await db.user.count({ where: { year: { in: validYears } } });
    const votedCount = await db.user.count({ where: { isVoted: true, year: { in: validYears } } });

    // ดึงสถานะระบบ (เปิด/ปิด)
    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await db.systemConfig.create({ data: { isVoteOpen: true } });
    }

    // รายชื่อตัวเลือกในบัตร (เรียงตามเบอร์) — score ติดไปด้วยเฉพาะหลังประกาศผลแล้ว
    //
    // H2 (2026-09-25): ของเดิมเป็น findMany เปล่า ๆ = ทุกคอลัมน์รวม score ทำให้กรรมการ
    // ทุกคนเปิด network tab ของแท็บตั้งค่าแล้วเห็นคะแนนสดรายพรรคได้ตลอดวันเลือกตั้ง
    // ทั้งที่ /api/results ปิดคะแนนแม้แต่กับแอดมิน (นโยบายความลับของบัตร 2026-06-10)
    // คะแนนสดต่อพรรค + turnout รายสาขา/ชั้นปีแบบสด = ย้อนดูได้ว่าคนที่เพิ่งกดโหวตเลือกใคร
    //
    // select แบบระบุชื่อ (แบบเดียวกับ /api/party) และเติม score เข้าไปเฉพาะเมื่อ
    // showResult เปิดแล้ว — ตรงกับที่ /api/results เปิดเผยให้ทุกคนเห็นในจังหวะเดียวกัน
    const candidates = await db.candidate.findMany({
      orderBy: { number: 'asc' },
      select: {
        id: true,
        name: true,
        number: true,
        slogan: true,
        logoUrl: true,
        color: true,
        ...(config.showResult ? { score: true } : {}),
      },
    });

    return NextResponse.json({
      stats: {
        totalVoters,
        votedCount,
        turnout: totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0,
        showResult: config.showResult,
        systemMode: config.systemMode || "AUTO",
        // the settings screen greys out "publish" until this is true
        boxClosed: isBoxClosed({
          systemMode: config.systemMode || "AUTO",
          end: resolveElectionDates(config.globalConfig).ELECTION_END,
        }),
        electionStart: resolveElectionDates(config.globalConfig).ELECTION_START,
        electionEnd: resolveElectionDates(config.globalConfig).ELECTION_END,
        certified: !!config.globalConfig?.ballotsAnonymized,
        googleFormUrl: config.googleFormUrl || "",
        // SEC-MOCK2 · สถานะ mock-login อ่านฝั่ง server ตอน runtime (read-only)
        // badge ในแท็บ settings ต้องใช้ค่านี้ ห้ามอ่าน NEXT_PUBLIC_* ฝั่ง client
        // เพราะค่านั้นถูก inline ตอน build จึงเป็นสถานะของ "เครื่องที่ build" ไม่ใช่เครื่องที่รันอยู่
        // SEC-MOCK3: เลิกส่ง mockLoginButtonVisible แล้ว — ปุ่มบนหน้า login อ่านจาก
        // /api/auth/providers ตอน runtime จึงเป็นเงาของค่านี้เสมอ ไม่ใช่สถานะแยกอีกต่อไป
        mockLoginProviderRegistered: isMockLoginProviderRegistered()
      },
      candidates
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

// 2. POST: สั่งการระบบ (Action)
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body = {};
  try { body = await req.json(); } catch { /* handled as an invalid action below */ }
  const res = await handleAction(body, auth);

  // /api/results serves the public a few-second snapshot; drop it after every
  // action that went through (mode, reveal, certification, ballot options — and
  // whatever gets added here later) so this process never holds a reveal back.
  if (res.ok) bustResultsSnap();

  // 📋 Audit trail — every admin command (who/what/when) AND whether it went
  // through. Written after the action on purpose: the table is append-only
  // (ballot-grants.sql), and a row written before the checks read the same for
  // a refused "publish results mid-vote" as for one that happened.
  // Best-effort: never block or change the response if logging fails.
  try {
    const { action: _a, ...rest } = body || {};
    let error = null;
    if (!res.ok) { try { error = (await res.clone().json())?.error || null; } catch { /* not JSON */ } }
    const detail = { ...rest, result: res.ok ? "ok" : `refused ${res.status}`, ...(error ? { error } : {}) };
    await db.adminAuditLog.create({
      data: {
        action: String(body?.action || "UNKNOWN"),
        actor: auth.user?.studentId || (auth.user?.id != null ? String(auth.user.id) : null),
        detail: JSON.stringify(detail),
      },
    });
  } catch (e) {
    console.error("[audit] failed to log admin action:", e.message);
  }
  return res;
}

async function handleAction(body, auth) {
  try {
    const { action, mode } = body || {};

    // กรณี: เปลี่ยนโหมดระบบ (AUTO, PAUSE, ENDED)
    if (action === 'SET_MODE') {
      try {
        await db.$transaction(async (tx) => {
          const config = await lockedConfig(tx);
          const err = checkSetMode({
            mode,
            showResult: !!config?.showResult,
            certified: !!config?.globalConfig?.ballotsAnonymized,
            end: resolveElectionDates(config?.globalConfig).ELECTION_END,
          });
          if (err) throw new GuardError(err, mode && ["AUTO", "PAUSE", "ENDED", "MANUAL_OPEN"].includes(mode) ? 409 : 400);
          await tx.systemConfig.update({ where: { id: 1 }, data: { systemMode: mode } });
        });
      } catch (e) {
        if (e instanceof GuardError) return NextResponse.json({ error: e.message }, { status: e.status });
        throw e;
      }
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: เปิด/ปิดการแสดงผล — ส่งค่าที่ต้องการมาตรง ๆ (value: true|false)
    // เดิมเป็น TOGGLE ("สลับค่า") ถ้าเปิดหน้าตั้งค่าไว้สองเครื่อง หรือกดซ้ำตอนเน็ตช้า
    // ผลจะกลับด้านกับที่แอดมินเห็นบนจอ · เปิดได้เฉพาะเมื่อหีบปิดแล้ว และซ่อนไม่ได้
    // เมื่อรับรองผลแล้ว — ผลที่รับรองต้องแสดงต่อสาธารณะ (adminGuards)
    if (action === 'SET_SHOW_RESULT') {
      try {
        await db.$transaction(async (tx) => {
          const config = await lockedConfig(tx);
          const err = checkShowResult({
            value: body.value,
            systemMode: config?.systemMode || "AUTO",
            end: resolveElectionDates(config?.globalConfig).ELECTION_END,
            certified: !!config?.globalConfig?.ballotsAnonymized,
          });
          if (err) throw new GuardError(err, typeof body.value === "boolean" ? 409 : 400);
          await tx.systemConfig.update({ where: { id: 1 }, data: { showResult: body.value } });
        });
      } catch (e) {
        if (e instanceof GuardError) return NextResponse.json({ error: e.message }, { status: e.status });
        throw e;
      }
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: อัปเดตลิงก์ Google Form
    if (action === 'SET_GOOGLE_FORM') {
      // Same rule as global-config PUT: the link becomes an iframe src for every
      // voter, so only a Google Forms link is stored (blank = clear).
      const raw = typeof body.url === "string" ? body.url.trim() : "";
      const url = raw ? normalizeFormUrl(raw) : "";
      if (url === null) return NextResponse.json({ error: FORM_URL_ERROR }, { status: 400 });
      let config = await db.systemConfig.findFirst();

      // ✅ Fix: หากยังไม่มี Config ให้สร้างใหม่ (ป้องกัน Crash)
      if (!config) {
        config = await db.systemConfig.create({
          data: {
            systemMode: "AUTO",
            isVoteOpen: false,
            showResult: false
          }
        });
      }

      await db.systemConfig.update({
        where: { id: config.id },
        data: { googleFormUrl: url || "" } // ป้องกัน undefined
      });
      return NextResponse.json({ message: "Success" });
    }

    // ⛔ RESET_VOTES / RESET_CANDIDATES ถูกถอดออก 2026-07-28
    //
    // ทั้งสอง action ล้างกล่องบัตร (`ballot.deleteMany`) ซึ่งต้องมีสิทธิ์ DELETE บนตาราง
    // "Ballot" — สิทธิ์ที่ production ตั้งใจไม่ให้ role ของแอป (ballot-grants.sql:28-30)
    // แปลว่าบนเครื่องจริงปุ่มพังแน่นอน ทั้งที่บน dev (ไม่ได้ลง grants) กดผ่าน — บั๊กที่จะ
    // โผล่เอาตอนขึ้นปีใหม่ · การล้างข้อมูลรายปีเป็นงานของเจ้าหน้าที่ฐานข้อมูลอยู่แล้ว
    // (เจ้าของยืนยัน 2026-07-28) → scripts/sql/annual-reset.sql
    //
    // ผลพลอยได้ด้านความปลอดภัย: ไม่มี API เส้นไหนที่ลบบัตรได้อีกเลย ต่อให้มีคนได้ session
    // แอดมินไป ก็ล้างผลเลือกตั้งที่กำลังเดินอยู่ไม่ได้

    // กรณี: รับรอง/ปิดผลอย่างเป็นทางการ (Certify — v2-SEC re-semantics of ANONYMIZE_BALLOTS)
    //
    // ⚠️ v2-SEC: ballots are now UNLINKABLE BY CONSTRUCTION — a Ballot row has no
    // userId and the choice is encrypted, so there is NO who-voted-for-whom link
    // left to wipe (that was the old model's job). What this action does now:
    //   • assert the box is closed + results published (unchanged guard)
    //   • flip the `ballotsAnonymized` flag = the CERTIFICATION marker downstream
    //     tools honour (e.g. reconcile refuses to --fix a certified DB).
    // The per-party tally is Candidate.score, kept atomically at vote time — it is
    // ALREADY the frozen record; there is nothing to re-count from a link column.
    // (The residual coarse hourBucket on each Ballot cannot be stripped here: the
    // production app role is INSERT-only on "Ballot". Removing it, if ever wanted,
    // is a documented offline DBA step — see scripts/sql/ballot-grants.sql.)
    if (action === 'ANONYMIZE_BALLOTS') {
      const cfg = await db.systemConfig.findFirst({ where: { id: 1 } });
      const mode = cfg?.systemMode || "AUTO";
      const ended = isBoxClosed({ systemMode: mode, end: resolveElectionDates(cfg?.globalConfig).ELECTION_END });

      // ป้องกันทำกลางคัน: ต้องปิดหีบแล้ว + ประกาศผลแล้วเท่านั้น (irreversible)
      if (!ended || !cfg?.showResult) {
        return NextResponse.json({ error: "ทำได้เฉพาะหลังปิดหีบและเผยแพร่ผลแล้วเท่านั้น" }, { status: 400 });
      }
      if (cfg?.globalConfig?.ballotsAnonymized) {
        return NextResponse.json({ message: "รับรองผลไปก่อนหน้านี้แล้ว" });
      }

      // Only a faculty staff account may certify. The committee runs the
      // election; signing off on its own result is the conflict this guard
      // exists to prevent. Staff accounts come from scripts/admin.js
      // --create-staff, which sets role STAFF and a password of their own so
      // the shared committee password cannot produce this signature.
      if (auth.user?.role !== "STAFF") {
        return NextResponse.json({
          error: "รับรองผลได้เฉพาะบัญชีเจ้าหน้าที่คณะเท่านั้น — ให้เจ้าหน้าที่เข้าสู่ระบบด้วยบัญชีของตนเองแล้วกดรับรอง",
        }, { status: 403 });
      }

      // Who signed, by name, so the results page and the year's archive can say
      // it. The audit log above already recorded the action against a studentId;
      // this is the copy meant to be read by people, not auditors.
      const certifiedAt = new Date().toISOString();

      // H3: break the xmin link between voters and ballots. The vote claims the
      // User row and inserts the Ballot row in ONE transaction, so both tuples
      // carry the same xmin and `User JOIN Ballot ON u.xmin = b.xmin` named the
      // voter of every ballot (measured 4 of 4). A no-op UPDATE writes a new
      // tuple version under THIS transaction's xid, which no ballot shares.
      // Residual (documented in BALLOT-SECURITY-GUIDE): before certification the
      // link exists, and old tuple versions persist until VACUUM / in WAL.
      //
      // The rows are re-stamped ONE AT A TIME IN RANDOM ORDER, not in one
      // statement: a plain UPDATE walks the table in its existing physical order
      // and writes the new tuples in that same order, so ORDER BY ctid still
      // reproduced cast order exactly after certification (measured 2026-10-03,
      // 20 voters: 20 of 20 positions, Spearman rho 1.0, before AND after).
      // Shuffling the visit order gives the new tuples shuffled ctids.
      // Limit (3,000-row simulation): at the default fillfactor the order after
      // this is random (rho 0.00 to 0.09), but when every page has free room the
      // updates are HOT and keep the old page, leaving page order intact (fillfactor
      // 50: rho 0.53). The DBA step CLUSTER "User" USING "User_studentId_key" after
      // certification closes that (rho 0.01-0.03), see MAINTENANCE-RUNBOOK 1.1 B.
      const votedRows = await db.$queryRaw`SELECT "id" FROM "User" WHERE "isVoted" = true`;
      const votedIds = votedRows.map((r) => r.id);
      for (let i = votedIds.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [votedIds[i], votedIds[j]] = [votedIds[j], votedIds[i]];
      }
      await db.$transaction(async (tx) => {
        for (const id of votedIds) {
          await tx.$executeRaw`UPDATE "User" SET "votedAt" = "votedAt" WHERE "id" = ${id}`;
        }
      }, { maxWait: 15000, timeout: 120000 });

      await db.systemConfig.update({
        where: { id: 1 },
        data: {
          globalConfig: {
            ...(cfg.globalConfig || {}),
            ballotsAnonymized: true,
            certifiedAt,
            certifiedBy: auth.user?.name || auth.user?.studentId || null,
            certifiedByUsername: auth.user?.studentId || null,
          },
        },
      });

      return NextResponse.json({
        success: true,
        certifiedAt,
        certifiedBy: auth.user?.name || auth.user?.studentId || null,
        message: "รับรองผลเรียบร้อย — ผลถูกล็อก เปิดรับคะแนนเพิ่มไม่ได้อีก",
      });
    }

    // กรณี: ซ่อมตัวเลือกพิเศษของบัตร (งดออกเสียง เบอร์ 0 / ไม่รับรอง เบอร์ -1)
    //
    // ทำไมต้องมีปุ่มนี้: syncCandidateSpecialOptions() ถูกเรียกเฉพาะตอนเพิ่มพรรค /
    // ลบพรรค / เปลี่ยนเบอร์พรรค เท่านั้น ฐานข้อมูลที่ตั้งพรรคไว้ก่อนโค้ดนั้นจะลง
    // (หรือ import ข้อมูลเข้ามา) จึงไม่มีแถวเบอร์ 0 / -1 เลย และเดิมไม่มีทางสร้าง
    // ขึ้นมาได้นอกจากลบพรรคทิ้งแล้วเพิ่มใหม่ — readiness ข้อ candidates.single เห็น
    // ปัญหานี้แต่ได้แค่รายงาน ปุ่มนี้คือทางแก้ที่ตรงกับสิ่งที่มันฟ้อง
    //
    // ใช้ได้เฉพาะก่อนมีบัตรจริง: การเพิ่ม/ลบตัวเลือกหลังมีบัตรแล้วคือการแก้โครงสร้าง
    // บัตรกลางคัน (เหตุผลเดียวกับ ballotBoxGuard ใน api/admin/candidates)
    if (action === 'SYNC_BALLOT_OPTIONS') {
      const [ballots, cfg] = await Promise.all([
        db.ballot.count(),
        db.systemConfig.findUnique({ where: { id: 1 }, select: { globalConfig: true } }),
      ]);

      if (cfg?.globalConfig?.ballotsAnonymized) {
        return NextResponse.json(
          { error: "รับรองผลไปแล้ว แก้ตัวเลือกในบัตรไม่ได้ — ผลการเลือกตั้งถูกปิดผนึกแล้ว" },
          { status: 409 }
        );
      }
      if (ballots > 0) {
        return NextResponse.json(
          { error: `มีบัตรลงคะแนนในระบบแล้ว ${ballots} ใบ จึงแก้ตัวเลือกในบัตรไม่ได้ — การแก้โครงสร้างบัตรกลางคันทำให้ผลนับไม่ตรง` },
          { status: 409 }
        );
      }

      let plan;
      try {
        plan = await db.$transaction((tx) => syncCandidateSpecialOptions(tx));
      } catch (e) {
        return NextResponse.json({ error: e.message || "ปรับตัวเลือกไม่สำเร็จ" }, { status: 409 });
      }

      const options = await db.candidate.findMany({
        where: { number: { lte: 0 } },
        select: { id: true, number: true, name: true },
        orderBy: { number: 'desc' },
      });

      const changed = [];
      if (plan.createAbstain) changed.push("เพิ่มตัวเลือกงดออกเสียง");
      if (plan.createDisapprove) changed.push("เพิ่มตัวเลือกไม่รับรอง");
      if (plan.removeDisapprove) changed.push("ลบตัวเลือกไม่รับรอง (เพราะมีพรรคจริงมากกว่าหนึ่งพรรค)");

      return NextResponse.json({
        success: true,
        plan,
        options,
        message: changed.length
          ? `ปรับตัวเลือกในบัตรเรียบร้อย — ${changed.join(", ")}`
          : "ตัวเลือกในบัตรครบถูกต้องอยู่แล้ว ไม่มีอะไรต้องแก้",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Action Error:", error); // Debugging
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}