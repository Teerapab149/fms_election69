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
                { success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
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
                { success: false, message: "บัญชีนี้ไม่มีสิทธิ์เข้าระบบจัดการ" },
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
                { success: false, message: "ระบบยังไม่ได้ตั้งรหัสผ่านแอดมิน กรุณาติดต่อผู้ดูแลเซิร์ฟเวอร์" },
                { status: 500 }
            );
        }

        // An account with its own password does NOT also accept the shared one.
        //
        // The old order tried the shared hash first and accepted it for every
        // admin, so anyone holding the committee password could sign in under
        // any admin username — including the staff account that certifies a
        // result. A signature the whole committee can produce is not a
        // signature, and break-glass exists precisely for when the shared
        // password is lost, so it must not depend on it either.
        //
        // Locked out of a personal password? scripts/admin.js --clear-personal
        // drops them all back to the shared one — except for STAFF, below.
        //
        // STAFF is the role that certifies a result, so the rule above has to
        // hold structurally and not merely because every script that touches
        // passwordHash remembers to skip this account. It did not: until
        // 2026-10-19 --clear-personal cleared every hash with no role filter,
        // and a STAFF account with a null hash fell through to the shared
        // committee password here, handing the whole committee the signature
        // this account exists to keep separate. The script skips STAFF now;
        // this refusal is the backstop for a row that already lost its hash,
        // or that someone edits in the database by hand.
        let ok = false;
        if (user.passwordHash) {
            ok = await bcrypt.compare(String(password), user.passwordHash);
        } else if (user.role === "STAFF") {
            console.error(`[admin/login] STAFF account ${user.studentId} has no personal password; refusing the shared one. Re-run: node scripts/admin.js --create-staff ${user.studentId} --name "<ชื่อ>"`);
            return NextResponse.json(
                { success: false, message: "บัญชีเจ้าหน้าที่นี้ยังไม่ได้ตั้งรหัสของตัวเอง และใช้รหัสกลางของกรรมการเข้าไม่ได้ กรุณาติดต่อผู้ดูแลเซิร์ฟเวอร์ให้ตั้งรหัสให้ใหม่" },
                { status: 403 }
            );
        } else if (sharedHash) {
            ok = await bcrypt.compare(String(password), sharedHash);
        }

        if (!ok) {
            return NextResponse.json(
                { success: false, message: "ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง" },
                { status: 401 }
            );
        }

        // 5) ออก JWT
        if (!process.env.ADMIN_JWT_SECRET) {
            return NextResponse.json(
                { success: false, message: "เซิร์ฟเวอร์ตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแลระบบ" },
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
            { success: false, message: "ระบบขัดข้อง กรุณาลองใหม่ภายหลัง" },
            { status: 500 }
        );
    }
}
