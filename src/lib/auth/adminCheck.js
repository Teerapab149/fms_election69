/**
 * Admin auth check helper for Template-system API routes.
 *
 * Accepts ADMIN role, STAFF role, or legacy isAdmin=true.
 * Phase 5+ will add role hierarchy and granular permissions.
 *
 * NOTE: Legacy admin APIs (config/candidates/etc.) use RSA token via
 * verifyAdminToken() and `x-admin-token` header. This helper is the new
 * NextAuth-session-based path for Phase 3 onward.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../auth.js";

/**
 * Require authenticated admin user.
 *
 * @returns { ok: true, user } on success
 * @returns { ok: false, status, error } on failure
 */
export async function requireAdmin() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[requireAdmin] session check failed:", err);
    return { ok: false, status: 500, error: "Session check failed" };
  }

  if (!session?.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const role = session.user.role || session.user.token?.role;
  const isAdmin = session.user.isAdmin === true;
  const studentId = session.user.studentId || session.user.token?.studentId;

  const hasAdminAccess =
    role === "ADMIN" ||
    role === "STAFF" ||
    isAdmin === true;

  if (!hasAdminAccess) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return {
    ok: true,
    user: {
      id: session.user.id || session.user.token?.id,
      studentId,
      role,
      isAdmin
    }
  };
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
