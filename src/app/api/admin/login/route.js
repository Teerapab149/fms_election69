import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit, clientIp } from "../../../../lib/rateLimit";

function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
}

export async function POST(request) {
    try {
        // Throttle brute-force against the bcrypt check: 10 attempts / 5 min / IP.
        const rl = rateLimit(`admin-login:${clientIp(request)}`, { limit: 10, windowMs: 5 * 60 * 1000 });
        if (!rl.ok) {
            return NextResponse.json(
                { success: false, message: `พยายามเข้าสู่ระบบบ่อยเกินไป ลองใหม่ใน ${rl.retryAfter} วินาที` },
                { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
            );
        }

        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอก Username และ Password" },
                { status: 400 }
            );
        }

        // 1) หา user
        const user = await db.user.findFirst({
            where: isEmail(username)
                ? { email: String(username).toLowerCase() }
                : { studentId: String(username) },
            select: {
                id: true,
                name: true,
                role: true,
                studentId: true,
                email: true,
                passwordHash: true,
                isAdmin: true
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        const isAllowed = (user.isAdmin === true);

        if (!isAllowed) {
            return NextResponse.json(
                { success: false, message: "คุณไม่มีสิทธิ์เข้าถึง (สำหรับ Admin เท่านั้น)" },
                { status: 403 }
            );
        }

        // 3) รหัสผ่าน — สองทาง ทางหลักคือ "รหัสกลาง" ที่กรรมการใช้ร่วมกัน
        //    (SystemConfig.adminPasswordHash) ตัวตนมาจาก username ที่พิมพ์
        //    ส่วนรหัสประจำบัญชี (User.passwordHash) เหลือไว้ให้บัญชีทางหนีไฟ
        //    ที่ไม่ควรใช้รหัสร่วมกับใคร — ดู scripts/admin.js --break-glass
        //
        //    ⛔ ทางเดิม ADMIN_PASSWORD_AUTH_EXTRA ("<email>+<secret>") ถูกถอดออก
        //    2026-07-28: มันสร้างรหัสให้บัญชีที่ยังไม่มี hash โดยอัตโนมัติ ซึ่งรวม
        //    บัญชีที่ SSO เคยตั้ง isAdmin ให้เอง และรูปร่างรหัสของมันมองจากข้างนอก
        //    ไม่ออก (ล็อกเจ้าของออกจากระบบมาแล้วหนึ่งครั้ง)
        const cfg = await db.systemConfig.findFirst({
            where: { id: 1 },
            select: { adminPasswordHash: true },
        });
        const sharedHash = cfg?.adminPasswordHash || null;

        if (!sharedHash && !user.passwordHash) {
            console.error("[admin/login] no admin password is set — run: node scripts/admin.js --rotate-password");
            return NextResponse.json(
                { success: false, message: "ระบบยังไม่ได้ตั้งรหัสผ่านแอดมิน — ติดต่อผู้ดูแลเซิร์ฟเวอร์" },
                { status: 500 }
            );
        }

        let ok = false;
        if (sharedHash) ok = await bcrypt.compare(String(password), sharedHash);
        if (!ok && user.passwordHash) ok = await bcrypt.compare(String(password), user.passwordHash);

        if (!ok) {
            return NextResponse.json(
                { success: false, message: "ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        // 5) ออก JWT
        if (!process.env.ADMIN_JWT_SECRET) {
            return NextResponse.json(
                { success: false, message: "Server misconfig: ADMIN_JWT_SECRET missing" },
                { status: 500 }
            );
        }

        const jwtToken = jwt.sign(
            {
                sub: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
                studentId: user.studentId || null,
            },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: "2h" }
        );

        const response = NextResponse.json(
            {
                success: true,
                message: "Login Success",
                user: {
                    name: user.name,
                    role: user.role,
                    studentId: user.studentId || null,
                    email: user.email,
                },
            },
            { status: 200 }
        );

        response.cookies.set({
            name: "admin_token",
            value: jwtToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 2,
        });

        return response;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { success: false, message: "Server Error" },
            { status: 500 }
        );
    }
}
