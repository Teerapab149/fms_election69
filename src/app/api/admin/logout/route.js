import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth/adminCheck";
import { writeAudit } from "../../../../lib/audit/adminAudit";
import { bustSiteData } from "../../../../lib/cache/siteData";

// Signing out used to clear the browser's cookie and nothing else: the token
// itself stayed valid for the rest of its two hours, so a copy of it (a shared
// lab computer, a synced browser profile) kept working (audit finding F8).
//
// It now also records, on the server, the moment this account signed out.
// requireAdmin refuses any token issued at or before that moment, so signing
// out ends the session on every device that account was signed in on. The
// cookie is cleared whether or not the caller's token is still good.
export async function POST(request) {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_token');

    const auth = await requireAdmin(request);
    if (!auth.ok) return response;   // nothing to end: no session, or already ended

    try {
        // One atomic statement on the row, so it cannot lose a concurrent save of
        // the settings form (which rewrites globalConfig under a row lock).
        const endedAt = Date.now();
        await db.$executeRaw`
          UPDATE "SystemConfig"
             SET "globalConfig" = jsonb_set(
                   COALESCE("globalConfig", '{}'::jsonb),
                   '{adminSessionsEndedAt}',
                   COALESCE("globalConfig"->'adminSessionsEndedAt', '{}'::jsonb)
                     || jsonb_build_object(${String(auth.user.id)}, ${endedAt}::bigint),
                   true)
           WHERE id = 1`;
        bustSiteData();
    } catch (e) {
        console.error("[admin/logout] could not record the sign-out:", e?.message || e);
    }
    await writeAudit({ action: "ADMIN_LOGOUT", actor: auth.user.studentId || String(auth.user.id), detail: { result: "ok" } });
    return response;
}
