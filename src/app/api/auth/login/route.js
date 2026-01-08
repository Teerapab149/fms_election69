import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(request) {
  try {
    // 1. รับค่าที่ส่งมา
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "กรุณากรอกรหัสนักศึกษา" }, { status: 400 });
    }

    // 2. ค้นหาใน Database
    const user = await db.user.findFirst({
      where: { studentId: studentId },
    });

    // 3. ถ้าไม่เจอ User
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลในระบบ (ลอง Seed ข้อมูลดูหรือยังครับ?)" }, { status: 404 });
    }

    // 4. เจอตัวจริง! ส่ง JSON กลับไป (นี่คือส่วนที่ขาดหายไปก่อนหน้านี้)
    return NextResponse.json({
      success: true,
      user: user,
    });

  } catch (error) {
    console.error("Login API Error:", error);
    // กรณี Error ก็ต้องส่ง JSON กลับไปบอกหน้าบ้าน
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}