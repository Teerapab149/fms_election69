// api/auth/openid-callback/route.js
import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import jwt from "jsonwebtoken";

export async function POST(req) {
  // สมมติรับข้อมูลที่ OpenID ส่งมาให้
  const { StudentID, StudentName, Email, FacultyID } = await req.json();

  // 1. ลองหา User คนนี้ในฐานข้อมูลเรา
  let user = await db.user.findUnique({
    where: { studentId: StudentID }
  });

  // 2. ถ้ายังไม่มี ให้สร้างใหม่ (Auto Register)
  if (!user) {
    user = await db.user.create({
      data: {
        studentId: StudentID,
        name: StudentName,
        email: Email,
        facultyId: FacultyID,
        role: "student" // เริ่มต้นให้เป็นนักศึกษาทั่วไป
      }
    });
  }

  // 3. (Optional) เช็คว่าเป็น Admin หรือไม่? (Hardcode รหัสนักศึกษาคุณลงไปเลย)
  // หรือจะไปแก้ใน Database เอาทีหลังก็ได้
  if (StudentID === "63xxxxxxx") { 
     // อาจจะอัปเดต role ใน db หรือยัดใส่ token เลยก็ได้
  }

  // 4. สร้าง Token ของเว็บเราเอง (JWT) เพื่อใช้ยืนยันตัวตนในหน้าถัดๆ ไป
  const token = jwt.sign(
    { 
      userId: user.id, 
      studentId: user.studentId, 
      role: user.role,
      isVoted: user.isVoted 
    },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1d" }
  );

  // 5. ส่งกลับไปพร้อม Cookie
  const response = NextResponse.json({ success: true, user });
  response.cookies.set("token", token, { httpOnly: true, path: "/" });
  
  return response;
}