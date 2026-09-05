import sharp from "sharp";

/**
 * รูปแบบไฟล์ที่ยอมให้ผู้ใช้อัปโหลดได้ — สามอย่างนี้เท่านั้น
 *
 * ทำไมต้องมีด่านนี้ (2026-09-05): GHSA-2xp9-vwfh-vxw4 (CVSS 9.5) คือ heap buffer
 * overflow ใน libheif ที่ sharp เรียกใช้ตอนถอดรหัส AVIF/HEIC — ไฟล์ที่จงใจทำให้พัง
 * ไฟล์เดียวก็รันโค้ดบนเซิร์ฟเวอร์ได้ ก่อนหน้านี้ route อัปโหลดตรวจแค่ `file.type`
 * ซึ่งคือ Content-Type ที่ browser ฝั่งผู้ส่งเป็นคนเขียนมาเอง = ปลอมได้ทันที
 * ส่วน sharp ไม่สนใจค่านั้นเลย มันดูจากไบต์จริง → ส่ง AVIF ที่แปะป้ายว่า image/png
 * ก็ทะลุถึง libheif ได้
 *
 * ด่านนี้จึงอ่าน **ไบต์จริง** ก่อน แล้วปฏิเสธก่อนที่ buffer จะไปถึง sharp เลย
 * ไม่ใช่ให้ sharp เป็นคนบอกว่ามันคือไฟล์อะไร (นั่นคือการปล่อยให้ libheif ทำงานไปแล้ว)
 */
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

/** brand ของตระกูล ISOBMFF ที่ต้องกันออกไป — ทั้งหมดวิ่งเข้า libheif */
const HEIF_BRANDS = new Set([
  "avif", "avis", "heic", "heix", "hevc", "hevx",
  "heim", "heis", "hevm", "hevs", "mif1", "msf1",
]);

/**
 * อ่าน magic bytes เพื่อบอกชนิดไฟล์จริง ไม่เชื่อ Content-Type หรือนามสกุลไฟล์
 *
 * เป็น JS ล้วน ไม่แตะ sharp/libvips/libheif เลย — จุดสำคัญคือด่านนี้ต้องตัดสินใจได้
 * โดยไม่ต้องให้ไลบรารีที่มีช่องโหว่แตะไฟล์ก่อน
 *
 * @param {Buffer} buffer  ไบต์ดิบของไฟล์ที่อัปโหลดมา
 * @returns {string|null}  "jpeg" | "png" | "webp" | "gif" | "avif-heif" | "bmp" | "tiff" | "svg" | null
 */
export function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }

  // WebP: "RIFF" ....(ขนาด 4 ไบต์).... "WEBP"
  if (buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
      buffer.subarray(8, 12).toString("latin1") === "WEBP") {
    return "webp";
  }

  // GIF: "GIF8"
  if (buffer.subarray(0, 4).toString("latin1") === "GIF8") return "gif";

  // ISOBMFF (AVIF/HEIC/HEIF): ไบต์ 4-8 = "ftyp" แล้วดู brand ที่ไบต์ 8-12
  if (buffer.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("latin1").toLowerCase();
    if (HEIF_BRANDS.has(brand)) return "avif-heif";
    return "isobmff"; // mp4 และญาติ ๆ — ไม่ใช่รูป ปฏิเสธเหมือนกัน
  }

  // BMP / TIFF — sharp อ่านได้ แต่เราไม่รับ
  if (buffer.subarray(0, 2).toString("latin1") === "BM") return "bmp";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
      buffer.subarray(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))) {
    return "tiff";
  }

  // SVG: เป็นข้อความ ฝัง <script> ได้ และ sharp จะ rasterize ให้ด้วย — ปฏิเสธ
  const head = buffer.subarray(0, 256).toString("latin1").trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "svg";

  return null;
}

/** ข้อผิดพลาดที่ route ฝั่งบนใช้แยกว่าเป็น "ไฟล์ไม่ผ่านด่าน" ไม่ใช่ "ระบบพัง" */
export class UnsupportedImageError extends Error {
  constructor(detected) {
    super("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น กรุณาแปลงไฟล์ก่อนอัปโหลด");
    this.name = "UnsupportedImageError";
    this.code = "UNSUPPORTED_IMAGE";
    this.detected = detected || "unknown";
  }
}

/**
 * ย่อ + บีบอัดรูปที่อัปโหลดเข้ามา ไม่ให้ไฟล์ 4K ถูกเสิร์ฟเต็มขนาด (ต้นเหตุหน้าเว็บอืด)
 * คุมความคมด้วยความกว้างสูงสุด + คุณภาพที่พอดี
 *
 * ⚠️ ปฏิเสธไฟล์ที่ไม่ใช่ JPG/PNG/WebP โดย **โยน error ออกไป ไม่ใช่คืน buffer เดิม**
 * ของเดิม catch แล้ว `return buffer` ทุกกรณี แปลว่าถ้า sharp ถอดรหัสไม่ได้ ไบต์ดิบ
 * ที่ผู้ใช้ส่งมาจะถูกเขียนลง public/ ตรง ๆ อยู่ดี — ไฟล์อะไรก็ได้ลงเว็บได้
 * ตอนนี้ fallback เหลือไว้เฉพาะกรณี "ไฟล์ถูกชนิดแต่ย่อไม่สำเร็จ" เท่านั้น
 *
 * @param {Buffer} buffer  ไบต์ดิบที่อัปโหลดมา
 * @param {object} opts
 * @param {number} opts.maxWidth  ความกว้างสูงสุด (ไม่ขยายภาพเล็กให้ใหญ่ขึ้น); ค่าเริ่มต้น 1600
 * @param {number} opts.quality   คุณภาพ JPEG/WebP 1-100; ค่าเริ่มต้น 80
 * @param {"jpeg"|"webp"|"keep"} opts.format  "keep" = คงชนิดเดิม (ใช้กับโลโก้ที่ต้องการพื้นหลังโปร่ง)
 * @returns {Promise<Buffer>} ไบต์ที่ย่อแล้ว
 * @throws {UnsupportedImageError} เมื่อไบต์จริงไม่ใช่ JPG/PNG/WebP
 */
export async function optimizeImage(buffer, { maxWidth = 1600, quality = 80, format = "jpeg" } = {}) {
  const detected = detectImageFormat(buffer);
  if (!ALLOWED_FORMATS.has(detected)) {
    console.warn("[imageOptimize] ปฏิเสธไฟล์อัปโหลด — ชนิดจริงคือ:", detected || "ไม่รู้จัก");
    throw new UnsupportedImageError(detected);
  }

  try {
    let img = sharp(buffer, { failOn: "none" })
      .rotate() // หมุนตาม EXIF ก่อน แล้วค่อยตัด metadata ทิ้ง
      .resize({ width: maxWidth, withoutEnlargement: true });

    if (format === "jpeg") img = img.jpeg({ quality, mozjpeg: true });
    else if (format === "webp") img = img.webp({ quality });
    // "keep" → ไม่ re-encode นอกจากย่อขนาด คง transparency ของ PNG ไว้

    const out = await img.toBuffer();
    // เก็บอันที่เล็กกว่า (ต้นฉบับที่ถูกบีบมาหนักแล้วอาจเล็กกว่าไฟล์ที่เรา encode ใหม่)
    return out.length && out.length < buffer.length ? out : buffer;
  } catch (e) {
    // ไฟล์ผ่านด่านชนิดมาแล้ว แค่ย่อไม่สำเร็จ — คืนต้นฉบับได้ ไม่ใช่ไฟล์แปลกปลอม
    console.warn("[imageOptimize] ย่อรูปไม่สำเร็จ ใช้ไฟล์ต้นฉบับแทน:", e?.message);
    return buffer;
  }
}
