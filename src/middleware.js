// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Edge-runtime JWT verification of the admin_token cookie (issued by
// /api/admin/login via jsonwebtoken HS256 with ADMIN_JWT_SECRET). `jose` is used
// because `jsonwebtoken` (node crypto) doesn't run on the edge.
async function isValidAdminToken(token) {
  if (!token) return false;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret)); // checks sig + exp
    return true;
  } catch {
    return false;
  }
}

// หน้าเครื่องมือฝั่งแอดมินที่ "ไม่ได้อยู่ใต้ /admin" แต่ต้องหวงเหมือนกัน
//
// ทั้งสามหน้านี้ render หน้าเลือกตั้งของจริงด้วยข้อมูลจำลอง (/template-playground
// กดผ่าน flow ได้ครบตั้งแต่ล็อกอินยันหน้ายืนยันว่าโหวตแล้ว) ตอนแรกตั้งใจให้เปิดสาธารณะ
// เพราะเป็น DB-free เลยดูไม่มีอะไรให้ขโมย — แต่ความเสี่ยงไม่ใช่ข้อมูลรั่ว มันคือ
// **นักศึกษาหลงเข้ามาแล้วเข้าใจว่าตัวเองใช้สิทธิ์ไปแล้ว** ทั้งที่ไม่มีบัตรใบไหนถูกนับ
// ช่วงเปิดหีบ ลิงก์หลุดใน LINE กลุ่มเดียวก็พอ
//
// ห้ามเปลี่ยนเป็น 404 เฉย ๆ: admin console เรียกใช้จริง — TemplateChooserTab.js:48
// และ PageDesignTab.js:322 ฝัง /template-preview เป็น iframe, PageDesignTab.js:384
// ลิงก์ไป /template-playground, PageDesignTab.js:648 เปิด /preview
// iframe วิ่งด้วย cookie ของแอดมินอยู่แล้ว การกั้นด้วย admin_token จึงไม่กระทบของเดิม
const ADMIN_TOOL_PAGES = ['/preview', '/template-preview', '/template-playground'];

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const isAdminPage = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';
  const isAdminTool = ADMIN_TOOL_PAGES.some((p) => path === p || path.startsWith(`${p}/`));
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';

  // /compose-lab คือ sandbox ของ Layer-2 Composition Editor ไม่มีใครในระบบลิงก์ถึง
  // และไม่ใช่เครื่องมือที่เจ้าหน้าที่ต้องใช้ → ปิดตายบน production ไปเลย ไม่ต้องมี
  // สวิตช์ให้เผลอเปิด (บทเรียนเดียวกับ mock-login: ตัวกั้นที่เชื่อได้คือ NODE_ENV
  // ไม่ใช่ flag ที่ต้องจำว่าต้องปิด)
  if (path === '/compose-lab' && process.env.NODE_ENV === 'production') {
    return NextResponse.rewrite(new URL(`${basePath}/_not-found`, request.url));
  }

  const token = request.cookies.get('admin_token')?.value;
  const valid = await isValidAdminToken(token);

  // 🛡️ Rule 1: entering /admin without a VALID token → bounce to login
  if (isAdminPage && !isLoginPage && !valid) {
    const res = NextResponse.redirect(new URL(`${basePath}/admin/login`, request.url));
    if (token) res.cookies.delete('admin_token'); // clear stale/forged cookie
    return res;
  }

  // 🛡️ Rule 3: หน้าเครื่องมือแอดมินนอก /admin — ด่านเดียวกัน คนนอกเด้งไปหน้าล็อกอิน
  if (isAdminTool && !valid) {
    const res = NextResponse.redirect(new URL(`${basePath}/admin/login`, request.url));
    if (token) res.cookies.delete('admin_token');
    return res;
  }

  // 🛡️ Rule 2: already validly logged in but hitting the login page → go to admin
  if (isLoginPage && valid) {
    return NextResponse.redirect(new URL(`${basePath}/admin`, request.url));
  }
}

// เฝ้า /admin + หน้าเครื่องมือแอดมินที่อยู่นอก /admin (ดู ADMIN_TOOL_PAGES)
export const config = {
  matcher: [
    '/admin/:path*',
    '/preview',
    '/template-preview',
    '/template-playground',
    '/compose-lab',
  ],
};
