import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, candidateId } = body;

    // 1. ตรวจสอบข้อมูล
    if (!studentId || candidateId === undefined) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 2. เช็คว่า User นี้เคยโหวตไปหรือยัง
    const user = await db.user.findFirst({
      where: { studentId: studentId }
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
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