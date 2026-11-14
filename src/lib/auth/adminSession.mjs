// What ends an admin session early (audit finding F8, 2026-11-14). Pure, no
// imports from the app, so node:test loads it directly
// (scripts/smoke/adminSession.test.mjs).
//
// The admin token is a signed JWT, good for two hours. Signing out only cleared
// the browser's cookie and rotating the password changed nothing for tokens
// already issued, so a copied token kept working. Two server-side facts now
// decide, both re-read on every request by requireAdmin (lib/auth/adminCheck):
//
//   pv                    a fingerprint of the bcrypt hash the session was opened
//                         with, carried in the token. A different hash in the
//                         database (password rotated, personal password set or
//                         cleared) means the token is refused.
//   adminSessionsEndedAt  SystemConfig.globalConfig.adminSessionsEndedAt[userId]
//                         = the millisecond that account last signed out. A token
//                         issued at or before it (its "ist" claim, also in
//                         milliseconds) is refused, on every device.
import { createHash } from "node:crypto";

/** Fingerprint of a password hash. Not reversible to the hash, and says nothing about the password. */
export function passwordVersion(hash) {
  if (typeof hash !== "string" || hash === "") return null;
  return createHash("sha256").update(`fms-admin-pv:${hash}`).digest("hex").slice(0, 16);
}

/** The millisecond this account last signed out, or null if it never did. */
export function sessionEndedAt(globalConfig, userId) {
  const v = globalConfig?.adminSessionsEndedAt?.[String(userId)];
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Whether a token is still good against the stored state. `ist` is the issue
 * time in milliseconds (JWT `iat` is whole seconds, too coarse: signing out and
 * straight back in within one second would refuse the new session).
 */
export function isSessionCurrent({ pv, ist, iat } = {}, { currentHash, globalConfig, userId }) {
  if (!pv || pv !== passwordVersion(currentHash)) return false;
  const endedAt = sessionEndedAt(globalConfig, userId);
  if (endedAt === null) return true;
  const issued = Number.isFinite(Number(ist)) ? Number(ist) : Number(iat) * 1000;
  return issued > endedAt;
}
