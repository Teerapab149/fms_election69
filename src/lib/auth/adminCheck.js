/**
 * Admin auth check helpers for ALL admin API routes (P0-1, 2026-06-10).
 *
 * Accepts ADMIN role, STAFF role, or isAdmin=true via either:
 *   1. NextAuth session (PSU SSO admins/staff)
 *   2. The signed `admin_token` JWT cookie from /api/admin/login
 * Phase 5+ may add role hierarchy and granular permissions.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth.js";
import { verifyAdminCookie } from "./verifyAdminJwt.js";

/**
 * Require authenticated admin user. Two accepted identities:
 *   1. NextAuth SSO session whose DB role is ADMIN/STAFF (or isAdmin flag) —
 *      PSU staff path.
 *   2. The `admin_token` JWT cookie from /api/admin/login (bcrypt + signed,
 *      ADMIN_JWT_SECRET) — the dedicated admin-login path (dev admin uses this).
 *
 * The old client-minted `x-admin-token` (RSA-wrapped NEXT_PUBLIC secret) path
 * was REMOVED — the secret shipped in the public bundle, so anyone could forge it.
 *
 * @param {Request} request - Next.js request (needed for the cookie path)
 * @returns { ok: true, user } | { ok: false, status, error }
 */
export async function requireAdmin(request) {
  // 1) NextAuth SSO session (PSU staff)
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[requireAdmin] session check failed:", err);
    session = null;
  }

  if (session?.user) {
    const role = session.user.role;
    const isAdmin = session.user.isAdmin === true;
    if (role === "ADMIN" || role === "STAFF" || isAdmin) {
      return {
        ok: true,
        user: { id: session.user.id, studentId: session.user.studentId, role, isAdmin: true },
      };
    }
  }

  // 2) Dedicated /admin/login JWT cookie
  const payload = verifyAdminCookie(request);
  if (payload) {
    return {
      ok: true,
      user: { id: payload.sub, studentId: payload.studentId || null, role: payload.role || "ADMIN", isAdmin: true, viaCookie: true },
    };
  }

  if (!session?.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }
  return { ok: false, status: 403, error: "Admin access required" };
}

/**
 * Route-handler guard. Returns a NextResponse to `return` on failure, or null
 * when the caller is an admin. Drop-in for the legacy pattern:
 *   const authError = await adminGuard(request);
 *   if (authError) return authError;
 */
export async function adminGuard(request) {
  const auth = await requireAdmin(request);
  if (auth.ok) return null;
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}

/**
 * Require STAFF role specifically (higher privilege).
 * Reserved for sensitive operations (Phase 5+).
 */
export async function requireStaff() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    return { ok: false, status: 500, error: "Session check failed" };
  }

  if (!session?.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const role = session.user.role || session.user.token?.role;

  if (role !== "STAFF") {
    return { ok: false, status: 403, error: "Staff role required" };
  }

  return { ok: true, user: session.user };
}
