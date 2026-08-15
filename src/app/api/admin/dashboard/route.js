import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { adminGuard, requireAdmin } from "../../../../lib/auth/adminCheck";
import { isMockLoginProviderRegistered } from "../../../../lib/auth";

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

    // ดึงคะแนนผู้สมัคร (เรียงตามเบอร์)
    const candidates = await db.candidate.findMany({
      orderBy: { number: 'asc' }
    });

    return NextResponse.json({
      stats: {
        totalVoters,
        votedCount,
        turnout: totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0,
        showResult: config.showResult,
        systemMode: config.systemMode || "AUTO",
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
  try {
    const body = await req.json();
    const { action, mode } = body;

    // 📋 Audit trail — record every mutating admin action (who/what/when) for
    // election accountability. Best-effort: never block the action if logging fails.
    try {
      const { action: _a, ...rest } = body;
      await db.adminAuditLog.create({
        data: {
          action: String(action || "UNKNOWN"),
          actor: auth.user?.studentId || (auth.user?.id != null ? String(auth.user.id) : null),
          detail: Object.keys(rest).length ? JSON.stringify(rest) : null,
        },
      });
    } catch (e) {
      console.error("[audit] failed to log admin action:", e.message);
    }

    // กรณี: เปลี่ยนโหมดระบบ (AUTO, PAUSE, ENDED)
    if (action === 'SET_MODE') {
      const validModes = ["AUTO", "PAUSE", "ENDED", "MANUAL_OPEN"];

      if (!validModes.includes(mode)) {
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
      }

      const config = await db.systemConfig.findFirst();

      // Certification is the end of the election. Reopening the box afterwards
      // would let score climb past the numbers someone already signed for, so
      // the mode is frozen from here — the flag used to be a label with nothing
      // behind it.
      if (config?.globalConfig?.ballotsAnonymized && mode !== "ENDED") {
        return NextResponse.json({
          error: "ผลถูกรับรองแล้ว เปลี่ยนโหมดไม่ได้ — การเลือกตั้งครั้งนี้ปิดอย่างเป็นทางการ",
        }, { status: 409 });
      }

      await db.systemConfig.update({
        where: { id: config.id },
        data: { systemMode: mode }
      });
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: สลับเปิด/ปิด การแสดงผล
    if (action === 'TOGGLE_SHOW_RESULT') {
      const config = await db.systemConfig.findFirst();
      await db.systemConfig.update({
        where: { id: config.id },
        data: { showResult: !config.showResult }
      });
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: อัปเดตลิงก์ Google Form
    if (action === 'SET_GOOGLE_FORM') {
      const { url } = body;
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
      const { resolveElectionDates } = await import("../../../../utils/electionConfig");
      const { ELECTION_END } = resolveElectionDates(cfg?.globalConfig);
      const ended = mode === "ENDED" || (mode === "AUTO" && Date.now() >= new Date(ELECTION_END).getTime());

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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Action Error:", error); // Debugging
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}