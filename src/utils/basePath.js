/**
 * Helper to handle base path for assets and API calls.
 *
 * The system now runs on its own domain (https://ovs.fms.psu.ac.th) and is served
 * from the root, so NEXT_PUBLIC_BASE_PATH is normally empty and this is an
 * identity function. It stays in place — and stays env-driven — because the app
 * must remain deployable under a subpath (the old cvs.fms.psu.ac.th/fms-ovs
 * shape) by setting BASE_PATH alone, with no code change.
 *
 * ⚠️ The default is '' (root). It must NOT be a hardcoded subpath: a default of
 * '/fms-ovs' meant that one missing env var silently prefixed all 234 call sites
 * and 404'd the whole site.
 *
 * Division of labour — do not blur it:
 *   • Next primitives (router.push, <Link>, next/font) take RAW paths; Next
 *     prepends its own basePath from next.config.mjs. Never getPath() those.
 *   • Everything else (fetch, <a href>, <img src>, window.location) takes
 *     getPath(), because nothing prefixes those for us.
 */
export const getPath = (path) => {
    if (path == null || typeof path !== 'string') {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[getPath] received non-string input:', path, '— returning empty string');
        }
        return '';
    }

    // ✅ External URLs and Data URIs pass through untouched. This check must come
    // FIRST: it used to sit below the `!basePath` early-return, which was
    // unreachable while the default was a non-empty subpath. With a root base
    // path that return fires, and 'https://x/y.png' would have come back as
    // '/https://x/y.png' (it does not start with '/', so it gets one prepended).
    // Live data hits this — admin-uploaded logoUrl / banner values and the
    // placehold.co + unsplash hosts allowlisted in next.config.mjs.
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Get base path from environment variable (injected at build time)
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Root deployment (the normal case) — nothing to prepend
    if (!basePath) return cleanPath;

    // If base path already included, return original (prevent double prefix)
    if (cleanPath.startsWith(basePath)) return cleanPath;

    // Combine logic: ensure no double slashes
    // basePath usually starts with / (e.g. /fms-ovs)
    // cleanPath starts with / (e.g. /api/vote)
    // We want /fms-ovs/api/vote

    // Remove trailing slash from basePath if present
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

    return `${cleanBasePath}${cleanPath}`;
};
