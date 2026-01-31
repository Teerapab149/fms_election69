// src/middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // อ่าน Path ปัจจุบัน
  const path = request.nextUrl.pathname;

  // เช็คว่ากำลังเข้าหน้า /admin หรือไม่
  const isAdminPage = path.startsWith('/admin');
  // เช็คว่าเป็นหน้า Login หรือไม่
  const isLoginPage = path === '/admin/login';

  // ดึงบัตรผ่าน (Cookie) ออกมาดู
  const token = request.cookies.get('admin_token')?.value;

  // 🛡️ กฎข้อที่ 1: จะเข้า Admin แต่ "ไม่มี" บัตรผ่าน -> ดีดไป Login
  if (isAdminPage && !isLoginPage && !token) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return NextResponse.redirect(new URL(`${basePath}/admin/login`, request.url));
  }

  // 🛡️ กฎข้อที่ 2: มีบัตรผ่านแล้ว แต่อยากเข้าหน้า Login -> ดีดกลับไป Admin (ไม่ต้องล็อกอินซ้ำ)
  if (isLoginPage && token) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return NextResponse.redirect(new URL(`${basePath}/admin`, request.url));
  }

}

// กำหนดขอบเขตงานของยาม (เฝ้าแค่เส้นทาง /admin)
export const config = {
  matcher: '/admin/:path*',
};