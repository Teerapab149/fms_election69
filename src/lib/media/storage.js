import path from "path";

/**
 * ที่เก็บรูปที่ผู้ใช้อัปโหลด — แหล่งความจริงเดียวของทั้งฝั่งเขียน (API อัปโหลด/ลบ)
 * และฝั่งอ่าน (/api/media)
 *
 * ทำไมต้องแยกออกจาก public/: public/ คือผลลัพธ์ของการ build ไม่ใช่ที่เก็บข้อมูล
 * ทุกวิธี deploy ที่ทำให้โฟลเดอร์นั้น "กลับไปเป็นของใหม่" — ก๊อป public เข้าโฟลเดอร์
 * standalone, clone ใหม่, git clean — จะพารูปที่คณะกรรมการอัปโหลดไว้หายไปด้วยเงียบ ๆ
 * ตั้ง UPLOAD_ROOT ไปที่ไดเรกทอรีนอกซอร์ส (เช่น /var/lib/fms-ovs/images) แล้ว deploy
 * กี่ครั้งก็ไม่แตะรูป
 *
 * ไม่ตั้งก็ยังทำงานเหมือนเดิมทุกอย่าง (public/images ใต้ cwd) — ของเดิมที่อัปไว้แล้ว
 * จึงไม่ต้องย้าย และ dev ไม่ต้องตั้งอะไรเพิ่ม
 */
export const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? path.resolve(process.env.UPLOAD_ROOT)
  : path.join(process.cwd(), "public", "images");

/**
 * รูปที่ติดมากับซอร์สโค้ด (โลโก้คณะ, พื้นผิวกระดาษของธีม receipt, svg placeholder)
 * อยู่ใน public/images ของ repo เสมอ ต่อให้ย้าย UPLOAD_ROOT ไปไหนก็ยังต้องเสิร์ฟได้
 */
export const BUNDLED_ROOT = path.join(process.cwd(), "public", "images");

/**
 * ลำดับการค้นหาไฟล์: ของที่อัปโหลดมาก่อน แล้วค่อยของที่มากับ repo
 * (ชื่อชนกันเมื่อไร ของที่แอดมินอัปทับต้องชนะ)
 */
export const MEDIA_ROOTS =
  UPLOAD_ROOT === BUNDLED_ROOT ? [UPLOAD_ROOT] : [UPLOAD_ROOT, BUNDLED_ROOT];

/** โฟลเดอร์ปลายทางของไฟล์ที่กำลังจะเขียน — ใช้แทน path.join(process.cwd(), "public/images/...") */
export function uploadDir(...segments) {
  return path.join(UPLOAD_ROOT, ...segments);
}

/** `/images/candidates/logo/x.jpg` → `candidates/logo/x.jpg` (null ถ้าไม่ใช่ path ของรูปในระบบ) */
export function relativeFromUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (!imageUrl.startsWith("/images/")) return null;
  const rel = imageUrl.slice("/images/".length);
  if (!rel || rel.includes("\0")) return null;
  return rel;
}

/**
 * ต่อ path ย่อยเข้ากับรากที่กำหนด แล้วยืนยันว่ายังอยู่ใต้รากนั้นจริง
 * (กัน ".." ที่หลุด decode มา และ NUL byte ที่ทำให้ fs ตัดชื่อไฟล์)
 */
export function safeJoin(root, segments) {
  const parts = Array.isArray(segments) ? segments : String(segments).split("/");
  if (!parts.length) return null;
  if (parts.some((s) => typeof s !== "string" || s.length === 0 || s.includes("\0"))) return null;
  const target = path.resolve(root, ...parts);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  return target;
}

/** ทุก path ที่ไฟล์นี้อาจอยู่ได้ เรียงตามลำดับความสำคัญ (ผู้เรียกเป็นคนเช็คว่ามีจริงไหม) */
export function candidatePaths(segments) {
  return MEDIA_ROOTS.map((root) => safeJoin(root, segments)).filter(Boolean);
}
