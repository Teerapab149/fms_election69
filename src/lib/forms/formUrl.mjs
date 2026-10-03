// The evaluation-form link is typed by an admin and later becomes an iframe src
// on the success page. Anything other than a Google Form there is a hole:
// `javascript:` is script in a framed context, and an arbitrary https site would
// put a lookalike page (a fake "sign in to see your result") inside our page.
// So the only values that survive are Google Forms links. Pure, no imports, so
// the server route, the client pages and node:test can all load it.

const MAX_LEN = 2000;

// Workspace forms still live at /a/<domain>/forms/..., hence the optional group.
const DOCS_FORMS_PATH = /^\/(?:a\/[A-Za-z0-9.-]+\/)?forms\/\S+$/;

/**
 * @param {unknown} raw
 * @returns {string|null} canonical https URL (no `embedded`, no #fragment,
 *   `usp=` etc. kept) or null when it is not an acceptable Google Forms link.
 */
export function normalizeFormUrl(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || s.length > MAX_LEN) return null;
  // WHATWG URL silently strips tab/CR/LF anywhere in the string, so
  // "https://docs.google.com/for\nms/..." would parse as valid. Refuse any
  // whitespace/control/backslash left inside rather than rely on that.
  if (/[\s\u0000-\u001f\u007f\\]/.test(s)) return null;

  let u;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "https:") return null;
  if (u.username || u.password) return null;   // https://docs.google.com@evil.com/...
  if (u.port) return null;

  if (u.hostname === "docs.google.com") {
    if (!DOCS_FORMS_PATH.test(u.pathname)) return null;   // not Sheets/Docs
  } else if (u.hostname === "forms.gle") {
    // Short links: /<id>, nothing else on that host is a form.
    if (!/^\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)) return null;
  } else {
    return null;
  }
  u.hash = "";
  u.searchParams.delete("embedded");   // we own this param; see embedFormUrl
  return u.toString();
}

/**
 * Same link ready for <iframe src>. Built with URL APIs because a stored
 * `...viewform?usp=send_form` plus a blind `?embedded=true` suffix gave two `?`.
 * @returns {string|null}
 */
export function embedFormUrl(raw) {
  const clean = normalizeFormUrl(raw);
  if (!clean) return null;
  const u = new URL(clean);
  u.searchParams.set("embedded", "true");
  return u.toString();
}

export const FORM_URL_ERROR =
  "ลิงก์แบบประเมินต้องเป็นลิงก์ Google Form ที่ขึ้นต้นด้วย https://docs.google.com/forms/ หรือ https://forms.gle/ เท่านั้น";
