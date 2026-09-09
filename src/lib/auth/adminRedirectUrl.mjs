function normalizeBasePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Build an absolute redirect URL for middleware.
 *
 * Behind nginx, requestUrl can carry the container-facing origin
 * (http://localhost:3000). Production redirects must use the canonical public
 * origin already configured for NextAuth. Development deliberately keeps the
 * request origin so localhost and alternate local ports continue to work.
 */
export function buildAdminRedirectUrl(pathname, requestUrl, env = process.env) {
  const basePath = normalizeBasePath(
    env.NEXT_PUBLIC_BASE_PATH || env.BASE_PATH
  );
  const route = pathname.startsWith("/") ? pathname : `/${pathname}`;

  let baseUrl = requestUrl;
  if (env.NODE_ENV === "production" && env.NEXTAUTH_URL) {
    try {
      baseUrl = new URL(env.NEXTAUTH_URL).origin;
    } catch {
      // setup.sh validates NEXTAUTH_URL; retain a same-request fallback so one
      // malformed env value does not turn every admin request into a 500.
    }
  }

  return new URL(`${basePath}${route}`, baseUrl);
}
