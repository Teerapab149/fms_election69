import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { ELECTION_CONFIG } from "../../../utils/electionConfig";

export const dynamic = "force-dynamic";

// ✅ 1. เพิ่ม parameter 'request' เข้ามาใน function เพื่อรับค่า Query Params
export async function GET(request) {
  try {
    // ✅ 2. ตรวจสอบว่าเป็น Admin หรือไม่? (จาก URL: /api/results?isAdmin=true)
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("isAdmin") === "true";

    // ==========================================
    // 1. 🕒 TIME CONFIGURATION
    // ==========================================
    const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = ELECTION_CONFIG;
    const now = new Date();

    let status = "WAITING";
    let isPreCampaign = false;

    // ✅ ปรับลำดับ: เช็คสถานะการเลือกตั้งก่อน
    if (now >= ELECTION_END) {
      status = "ENDED";
    } else if (now >= ELECTION_START) {
      status = "ONGOING";
    } else if (now >= CAMPAIGN_START) {
      status = "WAITING";
    } else {
      status = "PRE_CAMPAIGN";
      isPreCampaign = true;
    }

    // 🛡️ Double Check: ถ้าถึงเวลาโหวตหรือจบแล้ว ต้องไม่ใช่ PRE_CAMPAIGN แน่นอน
    if (status === "ONGOING" || status === "ENDED") {
      isPreCampaign = false;
    }

    // ==========================================
    // 2. 📥 FETCH DATA & PARTY LOGIC
    // ==========================================
    const allCandidates = await db.candidate.findMany({
      include: { members: true }
    });

    const realCandidates = allCandidates.filter(c => c.number > 0);
    const noVoteOption = allCandidates.find(c => c.number === 0);
    const disapproveOption = allCandidates.find(c => c.number === -1);

    let finalCandidates = [];

    // Logic: Single vs Multi Party
    if (realCandidates.length === 1) {
      finalCandidates = [...realCandidates];
      if (disapproveOption) finalCandidates.push(disapproveOption);
      if (noVoteOption) finalCandidates.push(noVoteOption);
    } else {
      finalCandidates = [...realCandidates];
      if (noVoteOption) finalCandidates.push(noVoteOption);
    }

    // ==========================================
    // 3. 🔒 SECURITY & VISIBILITY LOGIC
    // ==========================================

    // ✅ 3. ถ้าไม่ใช่ Admin ให้เข้าเงื่อนไขซ่อนข้อมูลตามปกติ
    if (!isAdmin) {
      if (isPreCampaign) {
        // คนทั่วไป: ก่อนเปิดตัว ไม่เห็นอะไรเลย
        finalCandidates = [];
      }
      else if (status !== "ENDED") {
        // คนทั่วไป: ยังไม่จบ เห็นรายชื่อแต่ไม่เห็นคะแนน (Score = 0)
        finalCandidates.sort((a, b) => a.number - b.number);
        finalCandidates = finalCandidates.map(c => ({ ...c, score: 0 }));
      }
      else {
        // คนทั่วไป: จบแล้ว เห็นคะแนนจริง เรียงตามคะแนน
        finalCandidates.sort((a, b) => b.score - a.score);
      }
    } else {
      // 👑 ADMIN: เห็นข้อมูลจริงตลอดเวลา (ไม่ต้องซ่อน)
      // เรียงตามเบอร์ผู้สมัครเพื่อให้ตรวจสอบง่าย (หรือจะเรียงตามคะแนนก็ได้)
      finalCandidates.sort((a, b) => a.number - b.number);
    }

    // ==========================================
    // 4. 📊 STATS & RESPONSE
    // ==========================================
    const totalEligible = await db.user.count();
    const totalVotesReal = await db.user.count({ where: { isVoted: true } });

    const majorStats = await db.user.groupBy({ by: ['major'], where: { isVoted: true }, _count: { major: true } });
    const yearStats = await db.user.groupBy({ by: ['year'], where: { isVoted: true }, _count: { year: true } });
    const genderStats = await db.user.groupBy({ by: ['gender'], where: { isVoted: true }, _count: { gender: true } });

    return NextResponse.json({
      status: status,
      totalVotes: totalVotesReal,
      candidates: finalCandidates,
      campaignDate: CAMPAIGN_START,
      stats: {
        totalEligible: totalEligible,
        byMajor: majorStats.map(i => ({ name: i.major, value: i._count.major })),
        byYear: yearStats.map(i => ({ name: i.year, value: i._count.year })),
        byGender: genderStats.map(i => ({ name: i.gender, value: i._count.gender })),
      }
    });

  } catch (error) {
    console.error("🔥 Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}