import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../lib/db";

export async function POST(request) {
  try {
    // 🔐 Security Fix: ดึง studentId จาก verified session แทน request body
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนลงคะแนน" }, { status: 401 });
    }

    const studentId = session.user.studentId; // ✅ จาก session ที่ verify แล้ว

    const body = await request.json();
    const { candidateId } = body;
    // หมายเหตุ: ไม่ใช้ studentId จาก body อีกต่อไป เพื่อป้องกันการโหวตแทนคนอื่น

    // 0. 🛑 SECURITY GATE:
    const systemConfig = await db.systemConfig.findFirst({ where: { id: 1 } });
    const mode = systemConfig?.systemMode || "AUTO";
    const { resolveElectionDates } = await import("../../../utils/electionConfig");
    const { ELECTION_END, ELECTION_START } = resolveElectionDates(systemConfig?.globalConfig);
    const now = Date.now();

    // 0.1 Check Manual Modes First
    if (mode === "PAUSE") {
      return NextResponse.json({ error: "ระบบปิดปรับปรุงชั่วคราว (System Maintenance)" }, { status: 403 });
    }

    if (mode === "ENDED") {
      return NextResponse.json({ error: "สิ้นสุดการลงคะแนนเเล้ว (Election Ended)" }, { status: 403 });
    }

    if (mode === "MANUAL_OPEN") {
      // Pass: Voting is forced open, ignore time check
    }

    // 0.2 Check Auto Mode (Scheduled Time)
    if (mode === "AUTO") {
      if (now < ELECTION_START) {
        return NextResponse.json({ error: "ยังไม่ถึงเวลาลงคะแนน (Not Started)" }, { status: 403 });
      }
      if (now >= ELECTION_END) {
        return NextResponse.json({ error: "หมดเวลาลงคะแนนเเล้ว (Auto Closed)" }, { status: 403 });
      }
    }

    // 1. ตรวจสอบข้อมูล
    if (candidateId === undefined) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 2. เช็คว่า User นี้เคยโหวตไปหรือยัง
    const user = await db.user.findFirst({
      where: { studentId: studentId }
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
    }

    // 🛑 Eligibility Check: Must be Year 1-4
    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    if (!validYears.includes(user.year)) {
      return NextResponse.json({ error: "เฉพาะนักศึกษาชั้นปีที่ 1-4 เท่านั้นที่มีสิทธิ์ลงคะแนน" }, { status: 403 });
    }

    if (user.isVoted) {
      return NextResponse.json({ error: "คุณใช้สิทธิ์เลือกตั้งไปแล้ว" }, { status: 403 });
    }

    // 3. เริ่ม Transaction (ทำพร้อมกัน 2 อย่าง: บวกคะแนนพรรค + แปะป้ายว่าโหวตแล้ว)
    await db.$transaction([
      // 3.1 เพิ่มคะแนนให้พรรค
      db.candidate.update({
        where: { id: parseInt(candidateId) },
        data: { score: { increment: 1 } },
      }),
      // 3.2 อัปเดตสถานะ User ว่าโหวตแล้ว
      db.user.update({
        where: { id: user.id },
        data: {
          isVoted: true,
          candidateId: parseInt(candidateId)
        },
      }),
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกคะแนน" }, { status: 500 });
  }
}