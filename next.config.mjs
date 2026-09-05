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
        // AVIF ปิดไว้โดยตั้งใจ — อย่าเติม 'image/avif' เข้ามาโดยไม่อ่านบรรทัดนี้ก่อน
        // GHSA-2xp9-vwfh-vxw4 (CVSS 9.5) คือ heap buffer overflow ใน libheif ที่ sharp
        // เรียกใช้ตอนจัดการ AVIF — กระทบ Next ทุกเวอร์ชันตั้งแต่ 10.0.0 ถึง 15.5.23
        // (เราอยู่ 14.2.35 และสาย 14 ไม่มี patch ให้แล้ว: dist-tag next-14 = 14.2.35)
        // ค่านี้เท่ากับ default ของ Next อยู่แล้ว แต่เขียนไว้ให้เห็นชัด ๆ เพราะ
        // "ค่า default ที่ปลอดภัย" ที่ไม่มีใครรู้ว่ามีอยู่ = ค่าที่รอวันถูกเปลี่ยน
        formats: ['image/webp'],
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
    // ปัจจุบันระบบอยู่บนโดเมนของตัวเอง (https://ovs.fms.psu.ac.th) เสิร์ฟจาก root
    // → ทั้งสองตัวว่าง = undefined = ไม่ prefix อะไรเลย
    // ถ้าตั้ง BASE_PATH ต้องตั้ง NEXT_PUBLIC_BASE_PATH ให้ค่าเดียวกันด้วยเสมอ:
    // ตัวนี้คุม router/<Link>/_next ของ Next เอง ส่วน NEXT_PUBLIC_BASE_PATH คุม
    // getPath() ที่ fetch/<a href>/<img src> ใช้ — ตั้งข้างเดียวคือครึ่งเว็บพัง
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
        // removeConsole:true strips EVERY console.* call, console.error included — so the
        // production build shipped with all 80 of them gone, 26 of those in API routes.
        // Proven on the standalone build: /api/health returned 503 with a dead DB and the
        // container log stayed empty, because its own console.error had been compiled out.
        // On election day that is the difference between "the vote API is throwing X" and
        // silence. Keep stripping log/debug noise; keep the two levels an operator needs.
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
    },
};

export default nextConfig;
