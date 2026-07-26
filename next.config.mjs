/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // QA runs several dev servers off this one checkout at the same time, and they
    // all wrote into the same .next — so one server's rebuild deleted the hashed
    // chunks another server's in-memory manifest still pointed at. The symptom is
    // "missing required error components, refreshing..." plus a 404 on
    // /_next/static/chunks/app/page.js in a browser, while the server itself is
    // perfectly healthy (2026-07-27; it cost two rounds of chasing bugs that were
    // never in the code). Unset means '.next' exactly as before, so docker build
    // and npm run dev are unchanged; a QA server starts with
    // NEXT_DIST_DIR=.next-qa3021 and can no longer corrupt anyone else's.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com'
            }
        ],
    },
    // รองรับการ Deploy บน path อื่น หรือ CDN ผ่าน Environment Variables
    assetPrefix: process.env.ASSET_PREFIX || undefined,
    basePath: process.env.BASE_PATH || undefined,
    async rewrites() {
        return [
            {
                source: '/api/auth/authentik/callback',
                destination: '/api/auth/callback/authentik',
            },
        ];
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
};

export default nextConfig;
