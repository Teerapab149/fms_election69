/**
 * Admin auth check helpers for ALL admin API routes (P0-1, 2026-06-10;
 * rewritten 2026-07-28).
 *
 * ONE way in: the signed `admin_token` cookie from /api/admin/login, which is
 * issued only against a studentId that is isAdmin in the DB plus the shared
 * committee password. A PSU SSO session grants nothing on its own — it used to
 * (role ADMIN/STAFF or isAdmin passed straight through), which meant anyone PSU
 * put in the "staff" group could drive the admin API without a password, and
 * middleware.js never saw those requests because it only matches /admin/:path*.
 *
 * The cookie is not the authority either — it is a claim that gets re-checked.
 * Every call re-reads isAdmin from the DB, so revoking someone takes effect on
 * their next request instead of whenever their 2h token happens to expire.
 */

import { NextResponse } from "next/server";
import { db } from "../db";
import { verifyAdminCookie } from "./verifyAdminJwt.js";

/**
 * Require an authenticated, still-current admin.
 * @param {Request} request - Next.js request (the cookie lives on it)
 * @returns { ok: true, user } | { ok: false, status, error, revoked? }
 */
export async function requireAdmin(request) {
  const payload = verifyAdminCookie(request);
  if (!payload) return { ok: false, status: 401, error: "Not authenticated" };

  // The token says who they were when they logged in. The DB says who they are
  // now — and that is the one that decides.
  let user = null;
  try {
    user = await db.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, studentId: true, name: true, role: true, isAdmin: true },
    });
  } catch (err) {
    console.error("[requireAdmin] admin re-check failed:", err);
    return { ok: false, status: 500, error: "Admin check failed" };
  }

  if (!user || user.isAdmin !== true) {
    // Demoted, deleted, or a token minted before the flag was taken away.
    return { ok: false, status: 403, error: "Admin access required", revoked: true };
  }

  return {
    ok: true,
    user: { id: user.id, studentId: user.studentId, name: user.name, role: user.role, isAdmin: true },
  };
}

/**
 * Route-handler guard. Returns a NextResponse to `return` on failure, or null
 * when the caller is an admin:
 *   const authError = await adminGuard(request);
 *   if (authError) return authError;
 *
 * A revoked caller also gets the stale cookie cleared, so the console bounces
 * them to the login page instead of sitting there half-working.
 */
export async function adminGuard(request) {
  const auth = await requireAdmin(request);
  if (auth.ok) return null;
  const res = NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.revoked) res.cookies.delete("admin_token");
  return res;
}

/**
 * Require STAFF role specifically. Kept for the Phase 5+ idea of a higher tier;
 * nothing calls it today, and it is NOT a second way in — it starts from the
 * same admin cookie.
 */
export async function requireStaff(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth;
  if (auth.user.role !== "STAFF") {
    return { ok: false, status: 403, error: "Staff role required" };
  }
  return auth;
}
