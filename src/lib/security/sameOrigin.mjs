// Same-origin check for state-changing API requests (CSRF), pure on purpose so the
// edge middleware and node:test (scripts/smoke/sameOrigin.test.mjs) load the same file.
//
// Why this exists: the session cookie is SameSite=Lax, and "ac.th" is a public
// suffix, so every *.psu.ac.th page counts as same-site with ovs.fms.psu.ac.th and
// the browser attaches the cookie to a cross-origin POST. A form with
// enctype="text/plain" can spell valid JSON, so another page could cast a vote as
// whoever was signed in (reproduced in a real browser, 2026-11-02).
//
// The rules, in order:
//   1. Sec-Fetch-Site, when the browser sent it: only "same-origin" passes. Browsers
//      set it themselves and page script cannot forge or remove it.
//   2. Otherwise Origin, when present: it passes only if its host equals the request
//      Host, or its origin equals the origin of NEXTAUTH_URL. The second branch is
//      for a reverse proxy that rewrites Host. "null" (sandboxed iframe, data: URL,
//      some redirects) is refused. Hosts are compared after URL parsing, never with
//      startsWith or includes, so ovs.fms.psu.ac.th.evil.com does not match.
//   3. Neither header: passes. Every browser sends at least one on a POST, and a
//      client that sends neither (curl, the smoke scripts) carries no ambient cookie
//      for an attacker to ride.

const WEB_SCHEMES = new Set(["http:", "https:"]);

function parseWebUrl(value) {
  try {
    const u = new URL(value);
    return WEB_SCHEMES.has(u.protocol) ? u : null;
  } catch {
    return null;
  }
}

// "ovs.fms.psu.ac.th", "localhost:3100", "[::1]:3000" -> normalized host (default
// ports dropped, lower-cased) or null when it does not parse as a host.
function normalizeHost(host) {
  if (typeof host !== "string" || host.trim() === "") return null;
  try {
    const u = new URL(`http://${host.trim()}`);
    if (u.username || u.password || u.pathname !== "/" || u.search || u.hash) return null;
    return u.host;
  } catch {
    return null;
  }
}

/**
 * @param {{ secFetchSite?: string|null, origin?: string|null, host?: string|null, nextAuthUrl?: string|null }} input
 * @returns {{ ok: boolean, reason: string }}
 */
export function checkSameOrigin({ secFetchSite, origin, host, nextAuthUrl } = {}) {
  const site = typeof secFetchSite === "string" ? secFetchSite.trim().toLowerCase() : "";
  if (site) {
    return site === "same-origin"
      ? { ok: true, reason: "sec-fetch-site-same-origin" }
      : { ok: false, reason: `sec-fetch-site-${site}` };
  }

  const hasOrigin = typeof origin === "string" && origin.trim() !== "";
  if (!hasOrigin) return { ok: true, reason: "no-origin-headers" };

  const o = parseWebUrl(origin.trim());
  if (!o) return { ok: false, reason: "origin-unparseable" };

  const hostWanted = normalizeHost(host);
  if (hostWanted && o.host === hostWanted) return { ok: true, reason: "origin-matches-host" };

  const configured = typeof nextAuthUrl === "string" && nextAuthUrl ? parseWebUrl(nextAuthUrl) : null;
  if (configured && o.origin === configured.origin) {
    return { ok: true, reason: "origin-matches-nextauth-url" };
  }

  return { ok: false, reason: "origin-mismatch" };
}

export const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** The single refusal body, so the middleware and tests agree on it. */
export const BAD_ORIGIN_BODY = Object.freeze({
  error: "คำขอนี้มาจากหน้าเว็บอื่น ระบบจึงไม่รับ กรุณาเปิดเว็บเลือกตั้งโดยตรงแล้วลองใหม่อีกครั้ง",
  code: "BAD_ORIGIN",
});
