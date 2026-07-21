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
        mockLoginProviderRegistered: isMockLoginProviderRegistered(),
        mockLoginButtonVisible: process.env.NEXT_PUBLIC_ENABLE_MOCK_LOGIN === "true"
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

    // 🛑 v2-R10 guard — both destructive resets below wipe the live ballot box;
    // while voting is effectively OPEN a mis-click would destroy a running
    // election. Require the box to be closed first: PAUSE / ENDED, or AUTO
    // outside the voting window. (MANUAL_OPEN = force-open → always blocked.)
    if (action === 'RESET_VOTES' || action === 'RESET_CANDIDATES') {
      const cfg0 = await db.systemConfig.findFirst({ where: { id: 1 } });
      const m0 = cfg0?.systemMode || "AUTO";
      let votingOpen = m0 === "MANUAL_OPEN";
      if (m0 === "AUTO") {
        const { resolveElectionDates } = await import("../../../../utils/electionConfig");
        const { ELECTION_START, ELECTION_END } = resolveElectionDates(cfg0?.globalConfig);
        const now = Date.now();
        votingOpen = now >= new Date(ELECTION_START).getTime() && now < new Date(ELECTION_END).getTime();
      }
      if (votingOpen) {
        return NextResponse.json(
          { error: "ระบบโหวตกำลังเปิดอยู่ — สั่งพักระบบ (PAUSE) หรือปิดระบบ (ENDED) ก่อน จึงจะรีเซ็ตข้อมูลได้" },
          { status: 400 }
        );
      }
    }

    // กรณี: ล้างคะแนนทั้งหมด (Reset) — pre-election / dev reset only.
    // NOTE (v2-SEC): this also empties the append-only ballot box + resets the
    // hash chain to genesis so score/ballots/chain stay consistent. That delete
    // needs DELETE on "Ballot", which the INSERT-only production app role does
    // NOT have (scripts/sql/ballot-grants.sql) — by design a CERTIFIED election
    // is not resettable through the app. In dev (grants not applied) it works.
    if (action === 'RESET_VOTES') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
      // 1. รีเซ็ต User ให้กลับเป็นยังไม่โหวต (เฉพาะนักศึกษาปี 1-4)
      await db.user.updateMany({
        where: { year: { in: validYears } },
        data: { isVoted: false, votedAt: null }
      });
      // 2. รีเซ็ตคะแนนผู้สมัครเป็น 0
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      // 3. เคลียร์กล่องบัตร + รีเซ็ตโซ่กลับ genesis (ให้ reconcile/verify ตรงกัน)
      await db.ballot.deleteMany({});
      await db.chainHead.upsert({
        where: { id: 1 },
        update: { head: 'GENESIS', seq: 0 },
        create: { id: 1, head: 'GENESIS', seq: 0 },
      });
      // 4. ปลดธง anonymized (กลับไปสถานะนับคะแนนสดตามปกติ)
      const cfg = await db.systemConfig.findFirst({ where: { id: 1 } });
      if (cfg?.globalConfig?.ballotsAnonymized) {
        await db.systemConfig.update({ where: { id: 1 }, data: { globalConfig: { ...cfg.globalConfig, ballotsAnonymized: false } } });
      }
      return NextResponse.json({ success: true, message: "Reset votes successfully for eligible students (Year 1-4)" });
    }

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

      // ตั้งธงรับรองผล → downstream tools (reconcile) ถือว่าคะแนนถูก freeze แล้ว
      await db.systemConfig.update({ where: { id: 1 }, data: { globalConfig: { ...(cfg.globalConfig || {}), ballotsAnonymized: true } } });

      return NextResponse.json({ success: true, message: "รับรองผลเรียบร้อย — บัตรทุกใบไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้ว และคะแนนรวมถูกบันทึกไว้ครบ" });
    }

    // กรณี: ล้างข้อมูลพรรคทั้งหมด (Reset Candidates)
    if (action === 'RESET_CANDIDATES') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      // Also reset each voter's cast flag (no candidateId link exists anymore)
      await db.user.updateMany({
        where: { year: { in: validYears } },
        data: { isVoted: false, votedAt: null }
      });
      // Empty the ballot box + reset the chain so a rebuilt party list starts clean
      await db.ballot.deleteMany({});
      await db.chainHead.upsert({
        where: { id: 1 },
        update: { head: 'GENESIS', seq: 0 },
        create: { id: 1, head: 'GENESIS', seq: 0 },
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