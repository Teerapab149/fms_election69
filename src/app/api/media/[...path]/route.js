import { NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";
import { candidatePaths } from "../../../../lib/media/storage";

/**
 * GET /api/media/<เส้นทางไฟล์ใต้ /images>
 *
 * ทำไมต้องมี route นี้ ทั้งที่รูปเคยอยู่ใน public/ แล้วเสิร์ฟได้เอง:
 *
 * Next อ่านรายชื่อไฟล์ใน public/ **ครั้งเดียวตอนเซิร์ฟเวอร์บูต** (setupFsCheck() ใน
 * node_modules/next/dist/server/lib/router-utils/filesystem.js เรียก
 * recursiveReadDir(publicFolderPath) รอบเดียว) จากนั้น production เสิร์ฟเฉพาะสิ่งที่
 * อยู่ใน Set นั้น — บรรทัดที่ไปดูดิสก์จริงถูกกั้นด้วย `if (!matchedItem && opts.dev)`
 *
 * ผลคือรูปที่แอดมินอัปโหลดหลังแอปบูต **404 ทั้งหมดบนเครื่องจริง** ทั้งที่ไฟล์เขียนลง
 * ดิสก์สำเร็จ (พิสูจน์บน ovs.fms.psu.ac.th 2026-09-11: URL ครบทุกตัวในฐานข้อมูล แต่
 * /images/candidates/logo/... ตอบ 404 ส่วนไฟล์ที่ติดมากับซอร์สตอบ 200) และ dev ไม่เคย
 * เจอเพราะ dev เช็คดิสก์สดทุกครั้ง
 *
 * เส้นทางนี้อ่านดิสก์ทุก request จึงไม่มี snapshot ให้ค้าง · next.config.mjs rewrite
 * /images/:path* มาที่นี่ในเฟส beforeFiles ทุก URL ที่เก็บไว้ในฐานข้อมูลจึงใช้ได้เหมือนเดิม
 */

export const dynamic = "force-dynamic";

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

  const contentType = CONTENT_TYPES[path.extname(segments[segments.length - 1]).toLowerCase()];
  if (!contentType) return notFound();

  // candidatePaths กันการหลุดออกนอกรากให้แล้ว และไล่หาไฟล์ตามลำดับ
  // UPLOAD_ROOT → public/images (ของที่แอดมินอัปทับต้องชนะของที่มากับ repo)
  let target = null;
  let info = null;
  for (const candidate of candidatePaths(segments)) {
    try {
      const found = await stat(candidate);
      if (found.isFile()) {
        target = candidate;
        info = found;
        break;
      }
    } catch {
      // ไม่มีไฟล์นี้ในรากนี้ — ลองรากถัดไป
    }
  }
  if (!target) return notFound();

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
