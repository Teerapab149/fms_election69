import { NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";

/**
 * GET /api/media/<เส้นทางไฟล์ใต้ public/images>
 *
 * ทำไมต้องมี route นี้ ทั้งที่ไฟล์อยู่ใน public/ อยู่แล้ว:
 *
 * Next อ่านรายชื่อไฟล์ใน public/ **ครั้งเดียวตอนเซิร์ฟเวอร์บูต** แล้วเก็บเป็น Set
 * (node_modules/next/dist/server/lib/router-utils/filesystem.js — setupFsCheck()
 * เรียก recursiveReadDir(publicFolderPath) รอบเดียว) จากนั้นทุก request เช็คแค่
 * `items.has(path)` และมีบรรทัด `if (!matchedItem && opts.dev)` ที่ไปดูดิสก์จริง
 * เฉพาะโหมด dev เท่านั้น
 *
 * ผลคือรูปที่แอดมินอัปโหลดหลังคอนเทนเนอร์บูต **404 ทั้งหมดบน production** ทั้งที่
 * ไฟล์เขียนลงดิสก์สำเร็จ (พิสูจน์บน ovs.fms.psu.ac.th 2026-09-11: URL ใน DB ครบทุกตัว
 * แต่ /images/candidates/logo/... ตอบ 404 ส่วนไฟล์ที่ติดมากับ image ตอน build ตอบ 200)
 * และ dev ไม่เคยเจอเพราะ dev เช็คดิสก์สดทุกครั้ง — บั๊กที่โผล่เฉพาะเครื่องจริง
 *
 * เส้นทางนี้อ่านจากดิสก์ทุกครั้ง จึงไม่มี snapshot ให้ค้าง · next.config.mjs rewrite
 * /images/:path* มาที่นี่ในเฟส beforeFiles ทุก URL เดิมในฐานข้อมูลจึงใช้ได้เหมือนเดิม
 */

export const dynamic = "force-dynamic";

const MEDIA_ROOT = path.join(process.cwd(), "public", "images");

// อนุญาตเฉพาะนามสกุลที่ระบบนี้มีจริง — ไม่ทำ mime lookup ทั่วไป เพราะ route นี้เสิร์ฟ
// ไฟล์จากโฟลเดอร์ที่ "ผู้ใช้อัปโหลดเข้าไปได้" การจำกัดชนิดไว้ที่นี่คือด่านสุดท้าย
const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const notFound = () => new NextResponse("Not Found", { status: 404 });

export async function GET(request, { params }) {
  const segments = params?.path;
  if (!Array.isArray(segments) || segments.length === 0) return notFound();

  // กัน path traversal: ต่อ path แล้วต้องยังอยู่ใต้ MEDIA_ROOT เท่านั้น
  // (".." ที่หลุด encode มา หรือ NUL byte ที่ทำให้ fs ตัดชื่อไฟล์ ถูกตัดตรงนี้)
  if (segments.some((s) => typeof s !== "string" || s.includes("\0"))) return notFound();
  const target = path.resolve(MEDIA_ROOT, ...segments);
  if (target !== MEDIA_ROOT && !target.startsWith(MEDIA_ROOT + path.sep)) return notFound();

  const contentType = CONTENT_TYPES[path.extname(target).toLowerCase()];
  if (!contentType) return notFound();

  let info;
  try {
    info = await stat(target);
  } catch {
    return notFound();
  }
  if (!info.isFile()) return notFound();

  // ETag จากขนาด+เวลาแก้ไข: รูปสมาชิกถูกเขียนทับด้วยชื่อเดิมได้ (1.jpg) การ cache
  // แบบ immutable จึงใช้ไม่ได้ — ให้เบราว์เซอร์ถามทุกครั้งแล้วตอบ 304 แทน
  const etag = `W/"${info.size}-${Math.floor(info.mtimeMs)}"`;
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=0, must-revalidate",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  // SVG เสิร์ฟเป็นเอกสารที่รันสคริปต์ได้ — ปิดตายเหมือนที่ image optimizer ของ Next ทำ
  if (contentType === "image/svg+xml") {
    headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  }

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  const data = await readFile(target);
  return new NextResponse(data, {
    status: 200,
    headers: { ...headers, "Content-Length": String(info.size) },
  });
}
