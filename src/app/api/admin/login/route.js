import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
}

export async function POST(request) {
    try {
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

        const isAllowed = (user.role === "ADMIN" && user.isAdmin === true);

        if (!isAllowed) {
            return NextResponse.json(
                { success: false, message: "คุณไม่มีสิทธิ์เข้าถึง (สำหรับ Admin เท่านั้น)" },
                { status: 403 }
            );
        }

        const dbEmail = String(user.email || "").toLowerCase();
        if (!dbEmail) {
            return NextResponse.json(
                { success: false, message: "บัญชีนี้ไม่มี email ในระบบ" },
                { status: 500 }
            );
        }

        if (!user.passwordHash) {
            const bootstrapSecret = process.env.ADMIN_PASSWORD_AUTH_EXTRA;
            if (!bootstrapSecret) {
                return NextResponse.json(
                    { success: false, message: "Server misconfig" },
                    { status: 500 }
                );
            }

            const expected = `${dbEmail}+${bootstrapSecret}`;

            if (String(password) !== expected) {
                return NextResponse.json(
                    { success: false, message: "รหัสผ่านไม่ถูกต้อง (ยังไม่ได้ตั้งรหัสแอดมิน)" },
                    { status: 401 }
                );
            }

            const newHash = await bcrypt.hash(String(password), 12);

            await db.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash },
            });
        } else {
            // 4) มี hash แล้ว -> compare ปกติ
            const ok = await bcrypt.compare(String(password), user.passwordHash);
            if (!ok) {
                return NextResponse.json(
                    { success: false, message: "ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง" },
                    { status: 401 }
                );
            }
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
