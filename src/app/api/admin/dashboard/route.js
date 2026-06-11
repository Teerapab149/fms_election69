import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { adminGuard, requireAdmin } from "../../../../lib/auth/adminCheck";

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
        isVoteOpen: config.isVoteOpen,
        showResult: config.showResult,
        systemMode: config.systemMode || "AUTO",
        googleFormUrl: config.googleFormUrl || ""
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

    // กรณี: ล้างคะแนนทั้งหมด (Reset)
    if (action === 'RESET_VOTES') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
      // 1. รีเซ็ต User ให้กลับเป็นยังไม่โหวต (เฉพาะนักศึกษาปี 1-4)
      await db.user.updateMany({
        where: { year: { in: validYears } },
        data: { isVoted: false, candidateId: null }
      });
      // 2. รีเซ็ตคะแนนผู้สมัครเป็น 0
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      // 3. ปลดธง anonymized (กลับไปนับคะแนนสดจาก candidateId อีกครั้ง)
      const cfg = await db.systemConfig.findFirst({ where: { id: 1 } });
      if (cfg?.globalConfig?.ballotsAnonymized) {
        await db.systemConfig.update({ where: { id: 1 }, data: { globalConfig: { ...cfg.globalConfig, ballotsAnonymized: false } } });
      }
      return NextResponse.json({ success: true, message: "Reset votes successfully for eligible students (Year 1-4)" });
    }

    // กรณี: ลบข้อมูลการลงคะแนนรายบุคคล (Anonymize ballots — P0-6, ballot secrecy)
    // เก็บ candidateId ไว้ระหว่างเลือกตั้งเพื่อความถูกต้อง แล้ว "freeze คะแนนรวมลง
    // Candidate.score → ล้าง User.candidateId ทั้งหมด" หลังประกาศผล เพื่อไม่ให้เหลือ
    // ร่องรอยว่าใครเลือกพรรคใด (isVoted ยังอยู่ เพื่อความถูกต้องของ turnout).
    if (action === 'ANONYMIZE_BALLOTS') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
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
        return NextResponse.json({ message: "ข้อมูลถูกลบไปก่อนหน้านี้แล้ว" });
      }

      // 1) freeze คะแนนสุดท้ายลงคอลัมน์ score (นับจาก candidateId ก่อนล้าง)
      const cands = await db.candidate.findMany({ select: { id: true } });
      for (const c of cands) {
        const n = await db.user.count({ where: { candidateId: c.id, year: { in: validYears } } });
        await db.candidate.update({ where: { id: c.id }, data: { score: n } });
      }
      // 2) ล้าง link ใครเลือกพรรคใด (คง isVoted ไว้)
      await db.user.updateMany({ where: { year: { in: validYears } }, data: { candidateId: null } });
      // 3) ตั้งธง → results จะอ่านคะแนนจากคอลัมน์ score ที่ freeze ไว้แทน _count
      await db.systemConfig.update({ where: { id: 1 }, data: { globalConfig: { ...(cfg.globalConfig || {}), ballotsAnonymized: true } } });

      return NextResponse.json({ success: true, message: "ลบข้อมูลการลงคะแนนรายบุคคลแล้ว — คะแนนรวมถูกบันทึกไว้ครบ" });
    }

    // กรณี: ล้างข้อมูลพรรคทั้งหมด (Reset Candidates) 
    if (action === 'RESET_CANDIDATES') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      // Also clear candidateId from users
      await db.user.updateMany({
        where: { year: { in: validYears } },
        data: { candidateId: null }
      });
      await db.member.deleteMany({});
      await db.candidate.deleteMany({});
      const newCandidate = await db.candidate.create({
        data: { name: "งดออกเสียง", number: 0, slogan: null, logoUrl: null, groupImageUrls: null }
      });
      return NextResponse.json({ message: "Database Reset Successful" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Action Error:", error); // Debugging
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}