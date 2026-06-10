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

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const isAdminPage = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';

  const token = request.cookies.get('admin_token')?.value;
  const valid = await isValidAdminToken(token);

  // 🛡️ Rule 1: entering /admin without a VALID token → bounce to login
  if (isAdminPage && !isLoginPage && !valid) {
    const res = NextResponse.redirect(new URL(`${basePath}/admin/login`, request.url));
    if (token) res.cookies.delete('admin_token'); // clear stale/forged cookie
    return res;
  }

  // 🛡️ Rule 2: already validly logged in but hitting the login page → go to admin
  if (isLoginPage && valid) {
    return NextResponse.redirect(new URL(`${basePath}/admin`, request.url));
  }
}

// เฝ้าแค่เส้นทาง /admin
export const config = {
  matcher: '/admin/:path*',
};
