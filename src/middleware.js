// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { buildAdminRedirectUrl } from './lib/auth/adminRedirectUrl.mjs';

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
// ฝัง /template-preview เป็น iframe ซึ่งวิ่งด้วย cookie ของแอดมินอยู่แล้ว การกั้นด้วย
// admin_token จึงไม่กระทบของเดิม
const ADMIN_TOOL_PAGES = ['/preview', '/template-preview', '/template-playground'];

// ─── Content-Security-Policy (H1 defence in depth, 2026-09-25) ───────────────
//
// Nonce-based, per request, the way Next documents it: Next reads the CSP from
// the *request* headers, pulls the nonce out and stamps it onto every script it
// renders (framework chunks + the inline RSC payload). 'strict-dynamic' then
// lets those nonce'd scripts load the rest of the chunks. An injected
// <script> without the nonce does not run — which is the point: H1 showed that
// one admin-controlled value reaching a <style> tag was enough to run script on
// /vote and cast ballots for whoever was logged in.
//
// This works only because every page is dynamically rendered (the root layout
// calls getServerSession + reads the DB), so each response carries a fresh nonce.
// A statically prerendered page would ship HTML without the nonce and break.
//
// style-src keeps 'unsafe-inline': framer-motion writes style attributes and the
// templates inject <style> tags. That is styling, not script execution.
function buildCsp(nonce) {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    // 'unsafe-eval' only for next dev (react-refresh); never in a production build
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // https: — party pages pull a texture from transparenttextures.com; data:/blob:
    // for inline placeholders and client-side image previews in the admin console
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    // success page embeds the evaluation Google Form; admin chooser embeds our own pages
    "frame-src 'self' https://docs.google.com https://forms.gle",
    "frame-ancestors 'self'",
    "form-action 'self' https://psusso.psu.ac.th",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

export async function middleware(request) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const withCsp = (res) => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };
  const response = await guardAdmin(request);
  if (response) return withCsp(response);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

// The admin gate, unchanged: returns a redirect response, or undefined to let the
// request through.
async function guardAdmin(request) {
  const path = request.nextUrl.pathname;
  const isAdminPage = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';
  const isAdminTool = ADMIN_TOOL_PAGES.some((p) => path === p || path.startsWith(`${p}/`));
  const adminUrl = (pathname) => buildAdminRedirectUrl(pathname, request.url);

  const token = request.cookies.get('admin_token')?.value;
  const valid = await isValidAdminToken(token);

  // 🛡️ Rule 1: entering /admin without a VALID token → bounce to login
  if (isAdminPage && !isLoginPage && !valid) {
    const res = NextResponse.redirect(adminUrl('/admin/login'));
    if (token) res.cookies.delete('admin_token'); // clear stale/forged cookie
    return res;
  }

  // 🛡️ Rule 3: หน้าเครื่องมือแอดมินนอก /admin — ด่านเดียวกัน คนนอกเด้งไปหน้าล็อกอิน
  if (isAdminTool && !valid) {
    const res = NextResponse.redirect(adminUrl('/admin/login'));
    if (token) res.cookies.delete('admin_token');
    return res;
  }

  // 🛡️ Rule 2: already validly logged in but hitting the login page → go to admin
  if (isLoginPage && valid) {
    return NextResponse.redirect(adminUrl('/admin'));
  }
}

// Every page (so each HTML response gets a CSP nonce) — guardAdmin() still only
// acts on /admin + ADMIN_TOOL_PAGES. Excluded: API routes (JSON, no HTML — and
// /api/vote stays free of middleware overhead), Next's static assets, and the
// /images rewrite to /api/media.
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|images/|favicon\\.ico).*)',
  ],
};
