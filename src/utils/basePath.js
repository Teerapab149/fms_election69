/**
 * Helper to handle base path for assets and API calls
 * This ensures the app works correctly both locally (no path) and in Docker with subpath
 */
export const getPath = (path) => {
    // Get base path from environment variable (injected at build time)
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/fms-ovs';

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If no base path, return original
    if (!basePath) return cleanPath;

    // ✅ Fix: Ignore external URLs and Data URIs
    if (path.startsWith('http') || path.startsWith('data:')) return path;

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
