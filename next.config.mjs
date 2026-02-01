/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
};

export default nextConfig;
