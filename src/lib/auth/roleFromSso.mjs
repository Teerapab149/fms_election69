/**
 * SSO group → role mapping, extracted pure so the invariant "signing in with
 * PSU SSO never grants admin" is unit-testable (scripts/smoke/roleFromSso.test.mjs)
 * instead of buried in the jwt callback.
 *
 * .mjs on purpose: node --test imports this file directly, and src/*.js is
 * CJS to plain Node (no "type":"module"). Next/webpack imports .mjs fine.
 *
 * ⚠️ `role` is DESCRIPTIVE ONLY — it records which PSU group the account signed
 * in from. It grants nothing. Admin authority is `User.isAdmin`, which only
 * scripts/admin.js writes, and reaching the console additionally requires the
 * shared committee password. Do not reintroduce a `role === "ADMIN"` check as an
 * authorisation test: PSU controls group membership, we control the flag.
 * (2026-07-28 — before this, "staff" in the groups claim was full admin.)
 *
 * The grant rule itself is documented in docs/MAINTENANCE-RUNBOOK.md §10.
 */

/**
 * Scan the WHOLE groups claim (order-independent, case-insensitive); highest
 * privilege wins.
 * @returns {"ADMIN"|"STAFF"|"student"}
 */
export function roleFromSsoGroups(groups) {
  const list = Array.isArray(groups) ? groups.map((g) => String(g).toLowerCase()) : [];
  if (list.includes("staff")) return "ADMIN";
  if (list.includes("faculty")) return "STAFF";
  return "student";
}
