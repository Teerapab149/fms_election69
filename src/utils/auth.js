// DEPRECATED (P0-1 security fix, 2026-06-10).
//
// Client-side admin-token minting was REMOVED. The old implementation built an
// RSA-wrapped token from NEXT_PUBLIC_ADMIN_AUTH_SECRET — but anything NEXT_PUBLIC_*
// ships in the public JS bundle, so any visitor could read the secret, forge the
// token, and call every admin API (reset votes, read live scores, etc.).
//
// Admin auth is now the httpOnly `admin_token` JWT cookie: set by /api/admin/login
// (bcrypt + jsonwebtoken HS256, ADMIN_JWT_SECRET), verified server-side by
// `requireAdmin` (src/lib/auth/adminCheck.js) and the edge middleware. The cookie
// is sent automatically on same-origin requests, so callers need no header.
//
// This stub stays so the legacy call sites still import cleanly; the null it
// returns becomes an ignored `x-admin-token` header. The remaining headers/imports
// are cosmetic dead code — safe to delete in a follow-up cleanup (they cannot
// affect auth or security now).
export const getEncryptedToken = () => null;
