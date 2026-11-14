// One place that writes AdminAuditLog rows for the admin API (audit finding F7,
// 2026-11-14). Before this only the election-control actions were logged
// (api/admin/dashboard, schedule changes, test tools); adding, editing and
// deleting parties, uploads, theme and layout changes, and every sign-in left
// no trace at all.
//
// The log is best-effort by design, like the rows the dashboard writes: a
// failed insert never blocks or changes the admin's request. It is append-only
// only where scripts/sql/ballot-grants.sql is applied (the web role gets
// INSERT + SELECT on the table, nothing else).
import { db } from "../db";
import { requireAdmin } from "../auth/adminCheck";

const clip = (v, n = 200) => (typeof v === "string" && v.length > n ? `${v.slice(0, n)}…` : v);

/** Insert one row. Never throws. */
export async function writeAudit({ action, actor = null, detail = {} }) {
  try {
    await db.adminAuditLog.create({
      data: {
        action: String(action).slice(0, 60),
        actor: actor == null ? null : String(actor).slice(0, 80),
        detail: JSON.stringify(detail),
      },
    });
  } catch (e) {
    console.error("[audit] failed to log admin action:", e?.message || e);
  }
}

// What is worth copying out of a successful JSON response: enough to say WHICH
// party / template / file the action touched, never a whole record.
const RESPONSE_KEYS = ["id", "name", "number", "slug", "activeTemplateId", "templateName", "url", "isLocked"];

/**
 * Run an admin handler and record who did what and whether it went through.
 *
 *   export async function PUT(request) {
 *     return audited(request, "CANDIDATE_UPDATE", () => updateCandidate(request));
 *   }
 *
 * Written AFTER the handler, so the row says "ok" or "refused 409" (same choice
 * as the dashboard route: the table is append-only, a row written first would
 * read the same for a refused action as for one that happened). A caller who
 * is not an admin changed nothing and is not logged — their request is the
 * handler's own 401.
 *
 * @param {Request} request
 * @param {string} action   stable name, e.g. "CANDIDATE_UPDATE"
 * @param {() => Promise<Response>} run
 * @param {{ params?: Promise<object>|object }} [ctx]  the route context, for :id
 */
export async function audited(request, action, run, ctx) {
  const res = await run();
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return res;

    const detail = { result: res.ok ? "ok" : `refused ${res.status}` };
    const queryId = new URL(request.url).searchParams.get("id");
    const params = ctx?.params ? await ctx.params : null;
    const target = params?.id ?? queryId;
    if (target != null) detail.target = clip(String(target), 80);

    let body = null;
    try { body = await res.clone().json(); } catch { /* not JSON */ }
    if (body && typeof body === "object") {
      if (!res.ok && body.error) detail.error = clip(String(body.error));
      if (res.ok) {
        for (const k of RESPONSE_KEYS) {
          const v = body[k];
          if (["string", "number", "boolean"].includes(typeof v)) detail[k] = clip(v);
        }
      }
    }
    await writeAudit({
      action,
      actor: auth.user?.studentId || (auth.user?.id != null ? String(auth.user.id) : null),
      detail,
    });
  } catch (e) {
    console.error("[audit] failed to log admin action:", e?.message || e);
  }
  return res;
}
