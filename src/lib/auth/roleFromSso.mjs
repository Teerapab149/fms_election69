/**
 * SSO group/allowlist → privilege mapping, extracted pure so the invariant
 * "a non-staff PSU account never gets admin" is unit-testable
 * (scripts/smoke/roleFromSso.test.mjs) instead of buried in the jwt callback.
 *
 * .mjs on purpose: node --test imports this file directly, and src/*.js is
 * CJS to plain Node (no "type":"module"). Next/webpack imports .mjs fine.
 *
 * The grant rule itself is documented in docs/MAINTENANCE-RUNBOOK.md §10.
 */

// Legacy fallback when ADMIN_STUDENT_IDS is unset — prod should set the env
// explicitly (these students graduate).
const DEFAULT_ADMIN_IDS = ["6610510149", "6610510129"];

/**
 * Scan the WHOLE groups claim (order-independent, case-insensitive); highest
 * privilege wins. Membership of "staff"/"faculty" is faculty-controlled in
 * PSU SSO — that control is what makes this grant safe (runbook §10).
 * @returns {"ADMIN"|"STAFF"|"student"}
 */
export function roleFromSsoGroups(groups) {
  const list = Array.isArray(groups) ? groups.map((g) => String(g).toLowerCase()) : [];
  if (list.includes("staff")) return "ADMIN";
  if (list.includes("faculty")) return "STAFF";
  return "student";
}

/**
 * Full privilege resolution for a sign-in: SSO-group role + designated-admin
 * allowlist. Designated admins keep role "student" (their ballot counts as a
 * student's); only the isAdmin flag is granted.
 * @param {{groups?: unknown, studentId?: string, adminIdsEnv?: string}} args
 *   adminIdsEnv = raw ADMIN_STUDENT_IDS value (comma-separated), passed in so
 *   this stays pure.
 * @returns {{role: "ADMIN"|"STAFF"|"student", isAdmin: boolean}}
 */
export function resolveSsoPrivileges({ groups, studentId, adminIdsEnv } = {}) {
  const role = roleFromSsoGroups(groups);
  const adminIds = (adminIdsEnv ? adminIdsEnv.split(",") : DEFAULT_ADMIN_IDS)
    .map((s) => s.trim())
    .filter(Boolean);
  const isDesignatedAdmin = adminIds.includes(String(studentId));
  return {
    role,
    isAdmin: isDesignatedAdmin || role === "ADMIN" || role === "STAFF",
  };
}
