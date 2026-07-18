/**
 * Verify the dedicated admin-login JWT.
 *
 * /api/admin/login issues a signed JWT (ADMIN_JWT_SECRET, 2h) in an httpOnly
 * SameSite=strict cookie named `admin_token` after bcrypt password check. THIS
 * is the cookie that actually authenticates admins logged in via /admin/login
 * (the dev admin 6610510149 has DB role "student" so the NextAuth SSO path does
 * NOT grant them admin — only this cookie does).
 *
 * Returns the decoded payload ({ sub, role, name, email, studentId }) when the
 * signature + expiry are valid, else null. NEVER throws.
 *
 * Node runtime only (uses `jsonwebtoken`). For the edge middleware use `jose`.
 */

import jwt from "jsonwebtoken";

export function verifyAdminCookie(request) {
  try {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) return null;
    const token = request?.cookies?.get?.("admin_token")?.value;
    if (!token) return null;
    return jwt.verify(token, secret); // throws on bad signature / expiry
  } catch {
    return null;
  }
}
