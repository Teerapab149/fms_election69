/**
 * Admin auth check helper for Template-system API routes.
 *
 * Accepts ADMIN role, STAFF role, or legacy isAdmin=true.
 * Phase 5+ will add role hierarchy and granular permissions.
 *
 * Auth bridge (Phase 3 Day 2B):
 *   1. Try NextAuth session (PSU SSO admins)
 *   2. Fall back to legacy x-admin-token RSA header (admins logged in via
 *      /admin/login dedicated page)
 *   Either path grants admin access.
 */

import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth.js";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  : null;

function verifyLegacyAdminToken(request) {
  const encryptedToken = request?.headers?.get?.("x-admin-token");
  if (!encryptedToken || !PRIVATE_KEY) return false;

  try {
    const buffer = Buffer.from(encryptedToken, "base64");
    const decrypted = crypto.privateDecrypt(
      { key: PRIVATE_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      buffer
    );
    const [secret, timestamp] = decrypted.toString("utf8").split("|");
    const expected = process.env.ADMIN_AUTH_SECRET || "fallback_secret";
    if (secret !== expected) return false;
    if (Date.now() - parseInt(timestamp, 10) > 3600000) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Require authenticated admin user.
 *
 * @param {Request} [request] - optional Next.js request, enables x-admin-token fallback
 * @returns { ok: true, user } on success
 * @returns { ok: false, status, error } on failure
 */
export async function requireAdmin(request) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[requireAdmin] session check failed:", err);
    session = null;
  }

  if (session?.user) {
    const role = session.user.role || session.user.token?.role;
    const isAdmin = session.user.isAdmin === true;
    const studentId = session.user.studentId || session.user.token?.studentId;

    const hasAdminAccess =
      role === "ADMIN" ||
      role === "STAFF" ||
      isAdmin === true;

    if (hasAdminAccess) {
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
  }

  if (request && verifyLegacyAdminToken(request)) {
    return {
      ok: true,
      user: { id: null, studentId: null, role: "ADMIN", isAdmin: true, legacyToken: true }
    };
  }

  if (!session?.user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }
  return { ok: false, status: 403, error: "Admin access required" };
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
