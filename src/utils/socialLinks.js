/**
 * ช่องทางติดต่อของพรรค — ตัวแปลงและตัวตรวจ ใช้ร่วมกันทั้งฝั่งแอดมินและหน้าเว็บ
 *
 * แอดมินพิมพ์ได้หลายแบบ ทั้ง `@unityconcord.fms`, `unityconcord.fms`,
 * `instagram.com/unityconcord.fms`, `https://www.instagram.com/unityconcord.fms/`
 * ทุกแบบต้องจบที่ URL มาตรฐานอันเดียวกัน:
 *
 *   instagram  https://www.instagram.com/<handle>/
 *   facebook   https://www.facebook.com/<handle>
 *   tiktok     https://www.tiktok.com/@<handle>
 *   website    URL ที่กรอกมา (ต้องเป็น http/https)
 *
 * ⚠️ กับดักที่เคยพลาด (แก้ 2026-07-30): เดิมใช้ "มีจุด = เป็นโดเมน" เดาชนิดของค่า
 * ชื่อผู้ใช้จริงของพรรคคือ `unityconcord.fms` ซึ่งมีจุด เลยกลายเป็น
 * https://unityconcord.fms ที่ไม่มีเว็บอยู่จริง · ช่องของแพลตฟอร์มจึงต้องถือว่า
 * "ทุกอย่างที่ไม่ใช่ลิงก์ของแพลตฟอร์มนั้น = ชื่อผู้ใช้" เท่านั้น ห้ามเดาเป็นโดเมน
 * มีแค่ช่อง "เว็บไซต์/ลิงก์อื่น" ช่องเดียวที่ยอมรับโดเมนเปล่า
 *
 * ตัวกรองสำคัญกว่าความสวย: อนุญาตเฉพาะ http/https — ค่าที่ผู้ใช้พิมพ์เองแล้วไปโผล่
 * ใน href คือช่องทางคลาสสิกของ javascript: / data: URL ถ้าไม่กรองที่ต้นทาง
 */

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", host: "instagram.com", placeholder: "unityconcord.fms หรือวางลิงก์ instagram เต็ม ๆ" },
  { key: "facebook", label: "Facebook", host: "facebook.com", placeholder: "ชื่อเพจ หรือวางลิงก์ facebook เต็ม ๆ" },
  { key: "tiktok", label: "TikTok", host: "tiktok.com", placeholder: "samofms หรือวางลิงก์ tiktok เต็ม ๆ" },
  { key: "website", label: "เว็บไซต์/ลิงก์อื่น", host: null, placeholder: "https://..." },
];

const SAFE_SCHEME = /^https?:\/\//i;
// ชื่อผู้ใช้ยอมรับ ตัวอักษร/ตัวเลข/จุด/ขีดล่าง/ขีดกลาง (ไอจีใช้จุดกับขีดล่างได้จริง)
// เพจเฟซบุ๊กเป็นภาษาไทยได้ จึงยอมรับอักษรที่ไม่ใช่ ASCII ด้วย ห้ามแค่ช่องว่างกับ /
const BAD_HANDLE = /[\s/\\?#]/;

const trimHandle = (v) => String(v || "").trim().replace(/^@+/, "").replace(/^\/+|\/+$/g, "");

/**
 * ดึง "ชื่อผู้ใช้" ออกจากสิ่งที่พิมพ์มา ไม่ว่าจะเป็นลิงก์เต็มหรือชื่อล้วน
 * @returns {string|null} null = ใช้ไม่ได้
 */
function handleFor(key, input, host) {
  let raw = String(input || "").trim();
  if (!raw) return null;

  const hasScheme = SAFE_SCHEME.test(raw);
  const mentionsHost = host && raw.toLowerCase().includes(host);

  // ลิงก์ของแพลตฟอร์มนั้น (มี scheme หรือไม่ก็ได้) → ดึงส่วนแรกของ path ออกมา
  if (mentionsHost) {
    try {
      const u = new URL(hasScheme ? raw : `https://${raw}`);
      const seg = decodeURIComponent(u.pathname).split("/").filter(Boolean)[0] || "";
      const h = trimHandle(seg);
      return h && !BAD_HANDLE.test(h) ? h : null;
    } catch {
      return null;
    }
  }

  // ลิงก์ของ "เว็บอื่น" มาโผล่ในช่องแพลตฟอร์ม = แอดมินวางผิดช่อง อย่าเดาให้
  if (hasScheme) return null;

  // ที่เหลือคือชื่อผู้ใช้ — จุดในชื่อเป็นเรื่องปกติ ห้ามตีความเป็นโดเมน
  const h = trimHandle(raw);
  return h && !BAD_HANDLE.test(h) ? h : null;
}

/**
 * รับสิ่งที่แอดมินพิมพ์ → คืน URL เต็มตามรูปแบบมาตรฐานของแต่ละแพลตฟอร์ม
 * หรือ null ถ้าใช้ไม่ได้
 */
export function normalizeSocial(key, input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);

  // เว็บไซต์/ลิงก์อื่น — ที่นี่ที่เดียวที่โดเมนเปล่าถือว่าเป็นลิงก์
  if (!platform || !platform.host) {
    const url = SAFE_SCHEME.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
    if (!isSafeUrl(url)) return null;
    try {
      const u = new URL(url);
      return u.hostname.includes(".") ? url : null; // "abc" เฉย ๆ ไม่ใช่เว็บ
    } catch { return null; }
  }

  const handle = handleFor(key, raw, platform.host);
  if (!handle) return null;

  if (key === "instagram") return `https://www.instagram.com/${handle}/`;
  if (key === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return `https://www.facebook.com/${handle}`;
}

/** อนุญาตเฉพาะ http/https ที่ parse ได้จริง */
export function isSafeUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** เก็บกวาดทั้งก้อนก่อนลงฐานข้อมูล — คืน null ถ้าไม่มีช่องทางไหนใช้ได้เลย */
export function sanitizeSocials(input) {
  if (!input || typeof input !== "object") return null;
  const out = {};
  for (const { key } of SOCIAL_PLATFORMS) {
    const url = normalizeSocial(key, input[key]);
    if (url) out[key] = url;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * แปลงค่าที่เก็บไว้ → รายการพร้อมแสดงผล (ข้ามช่องทางที่ว่างหรือลิงก์ไม่ปลอดภัย)
 * @returns {{key:string,label:string,url:string,handle:string}[]}
 */
export function socialList(socials) {
  if (!socials || typeof socials !== "object") return [];
  return SOCIAL_PLATFORMS
    .map(({ key, label }) => {
      const url = socials[key];
      if (!url || !isSafeUrl(url)) return null;
      let handle = "";
      try {
        const u = new URL(url);
        if (key === "website") {
          handle = u.hostname.replace(/^www\./, "");
        } else {
          const seg = decodeURIComponent(u.pathname).split("/").filter(Boolean)[0] || "";
          handle = seg ? (seg.startsWith("@") ? seg : `@${seg}`) : "";
        }
      } catch { handle = ""; }
      return { key, label, url, handle };
    })
    .filter(Boolean);
}
