// The e-mail address printed on /privacy for questions about personal data.
// The faculty types it on ตั้งค่าทั่วไป, so it is never hard-coded. Pure (no
// imports) so the admin route, the public page, the readiness check and
// node:test can all load it.
//
// It ends up inside a mailto: link, so the check is deliberately narrow: one
// "@", no whitespace or control characters, a dotted domain. Anything that
// could smuggle a header or a second recipient into the link ("," ";" "?" "&"
// "%" "<" ">" quotes) is refused rather than escaped.

export const PRIVACY_EMAIL_ERROR =
  "อีเมลติดต่อเรื่องข้อมูลส่วนบุคคลต้องเป็นอีเมลที่ถูกต้องเพียงหนึ่งที่อยู่ เช่น name@psu.ac.th";

const MAX_LEN = 254;
const SHAPE = /^[A-Za-z0-9._+\-]+@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)+$/;

/**
 * @param {unknown} raw
 * @returns {string|null} the trimmed address, or null when it is not acceptable.
 *   An empty string is not an address: callers treat blank as "not set" before
 *   calling this.
 */
export function normalizePrivacyEmail(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || s.length > MAX_LEN) return null;
  if (!SHAPE.test(s)) return null;
  const [local] = s.split("@");
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  return s;
}

/** the address to print and link, or "" when none is set or the stored value is unusable */
export function privacyEmailOf(config) {
  const v = config?.privacyContactEmail;
  if (v == null || String(v).trim() === "") return "";
  return normalizePrivacyEmail(v) || "";
}
