/**
 * GET /api/admin/me — who is holding this admin session, checked against the DB
 * right now.
 *
 * Two jobs:
 *   1. the console shows the real person ("6610510149 · ผู้ดูแลระบบ") instead of
 *      a hardcoded "Administrator", so it is obvious whose actions the audit log
 *      is about to record
 *   2. it is the console's liveness check on its own authority — requireAdmin
 *      re-reads isAdmin on every call, so a revoked admin gets 403 here, the
 *      stale cookie is cleared, and the page sends them back to the login form
 *      instead of sitting on a console where every button fails
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/adminCheck";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    const res = NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.revoked) res.cookies.delete("admin_token");
    return res;
  }
  return NextResponse.json({
    user: {
      studentId: auth.user.studentId,
      name: auth.user.name,
      role: auth.user.role,
      isAdmin: true,
    },
  });
}
