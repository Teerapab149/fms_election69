import { db } from "../../../../lib/db";
import { NextResponse } from "next/server";

// 1. GET: ดึงข้อมูลสรุป (Dashboard Stats)
export async function GET() {
  try {
    // ดึงจำนวนคนทั้งหมด / คนที่โหวตแล้ว
    const totalVoters = await db.user.count({ where: { role: 'student' } }); // ไม่นับ Admin
    const votedCount = await db.user.count({ where: { role: 'student', isVoted: true } });

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
        isVoteOpen: config.isVoteOpen
      },
      candidates
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

// 2. POST: สั่งการระบบ (Action)
export async function POST(req) {
  try {
    const { action } = await req.json();

    // กรณี: สลับเปิด/ปิด ระบบ
    if (action === 'TOGGLE_VOTE') {
      const config = await db.systemConfig.findFirst();
      await db.systemConfig.update({
        where: { id: config.id },
        data: { isVoteOpen: !config.isVoteOpen }
      });
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: ล้างคะแนนทั้งหมด (Reset) 
    if (action === 'RESET_VOTES') {
      // 1. รีเซ็ต User ให้กลับเป็นยังไม่โหวต (เฉพาะ User ธรรมดา)
      await db.user.updateMany({
        where: { role: 'USER' },
        data: { isVoted: false, candidateId: null }
      });
      // 2. รีเซ็ตคะแนนผู้สมัครเป็น 0
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      return NextResponse.json({ message: "Database Reset Successful" });
    }

    // กรณี: ล้างข้อมูลพรรคทั้งหมด (Reset Candidates) 
    if (action === 'RESET_CANDIDATES') {
      await db.user.updateMany({
        where: {
          isVoted: true
        },
        data: {
          isVoted: false,
          candidateId: null
        }
      });
      await db.member.deleteMany({});
      await db.candidate.deleteMany({});
      const newCandidate = await db.candidate.create({
        data: { name: "งดออกเสียง", number: 0, slogan: null, logoUrl: null, groupImageUrl: null }
      });
      return NextResponse.json({ message: "Database Reset Successful" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}