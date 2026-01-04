import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db"; // 👈 1. อย่าลืม import db เข้ามา

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // ✅ 2. เปลี่ยนจากการเช็คคำ (Hardcode) เป็นค้นหาใน Database
        const user = await db.user.findFirst({
            where: {
                studentId: username, // ใช้ studentId เป็น username
                password: password   // (ใน Production ควร Hash รหัสผ่าน แต่นี่ใช้แบบธรรมดาตาม Seed ไปก่อน)
            }
        });

        // ❌ 3. กรณีไม่พบ User หรือรหัสผิด
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง' },
                { status: 401 }
            );
        }

        // ❌ 4. พบ User แต่ไม่ใช่ ADMIN (กันนักศึกษาหลงเข้ามา)
        if (user.role != 'ADMIN' && user.role != 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, message: 'คุณไม่มีสิทธิ์เข้าถึง (สำหรับ Admin เท่านั้น)' },
                { status: 403 }
            );
        }

        // ✅ 5. ผ่านทุกด่าน -> Login สำเร็จ
        const response = NextResponse.json(
            {
                success: true,
                message: 'Login Success',
                // ⭐ ส่งข้อมูล user กลับไปให้หน้าบ้านเก็บลง LocalStorage (แก้จอหมุน)
                user: {
                    name: user.name,
                    role: user.role,
                    studentId: user.studentId
                }
            },
            { status: 200 }
        );

        // (Optional) ฝัง Cookie ไว้ด้วยเผื่อใช้ในอนาคต
        response.cookies.set({
            name: 'admin_token',
            value: 'super_secret_token_123', // ในระบบจริงควรใช้ JWT Token
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24, // 1 วัน
        });

        return response;

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { success: false, message: 'Server Error: เชื่อมต่อฐานข้อมูลไม่ได้' },
            { status: 500 }
        );
    }
}