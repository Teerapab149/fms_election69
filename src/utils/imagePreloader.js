"use client";

import { getPath } from './basePath';

const DEFAULT_CROP = { objectPosition: '50% 35%' };

// Global cache — จำว่ารูปไหนถูกโหลดไว้แล้ว
const cropCache = new Map();
const imageCache = new Map();

/**
 * โหลดรูปล่วงหน้าให้เข้า cache ของเบราว์เซอร์ เพื่อให้ตอนหน้าวาดจริงรูปขึ้นพร้อมกันทันที
 *
 * ⚠️ ไม่คำนวณ smartcrop ที่นี่อีกแล้ว (เดิมรัน smartcrop.crop() ต่อทุกรูป = ถอดรหัสรูป
 * ลง canvas แล้ววิเคราะห์ทีละรูปบน CPU ของเครื่องผู้ใช้ พรรคละ 20 คนก็ 20+ รอบ
 * แย่งเครื่องตอนที่กำลังจะวาดหน้าพอดี) การเลือกกรอบย้ายไปทำตอนอัปโหลดด้วย
 * sharp.strategy.attention ใน processMemberImage() — ตัดมาเป็น 4:5 ให้ตรงช่องแล้ว
 * เบราว์เซอร์จึงไม่มีอะไรต้องตัดสินใจอีก
 *
 * ⚠️ ไม่ตั้ง crossOrigin ด้วย: <img> ที่หน้าเว็บวาดจริงไม่ได้ตั้ง การ preload แบบ CORS
 * จึงเป็นคนละ request กันในสายตาเบราว์เซอร์ (วัดบนเครื่องจริงได้ 2 requests ต่อรูป)
 *
 * @param {string} src - URL ของรูปภาพ
 * @returns {Promise<{objectPosition: string}>}
 */
export async function preloadImage(src) {
    if (!src) return DEFAULT_CROP;

    if (cropCache.has(src)) {
        return cropCache.get(src);
    }

    return new Promise((resolve) => {
        const img = new Image();

        const done = () => {
            imageCache.set(src, true);
            cropCache.set(src, DEFAULT_CROP);
            resolve(DEFAULT_CROP);
        };

        img.onload = done;
        img.onerror = done;
        img.src = src;
    });
}

/**
 * Preload รูปภาพทั้งหมดของ Party พร้อมกัน
 * @param {Array} parties - Array ของ party data
 * @returns {Promise<void>}
 */
export async function preloadPartyImages(parties) {
    if (!parties || parties.length === 0) return;

    const allImageUrls = [];

    parties.forEach(party => {
        // Logo
        if (party.logoUrl) allImageUrls.push(party.logoUrl);

        // Official Image (Robust Parsing)
        if (party.officialImageUrl) {
            try {
                let images = [];
                if (Array.isArray(party.officialImageUrl)) {
                    images = party.officialImageUrl;
                } else if (typeof party.officialImageUrl === 'string') {
                    const trimmed = party.officialImageUrl.trim();
                    if (trimmed.startsWith('[')) {
                        images = JSON.parse(trimmed);
                    } else {
                        images = [trimmed];
                    }
                }
                images.forEach(url => {
                    if (url && typeof url === 'string') allImageUrls.push(url);
                });
            } catch (e) {
                console.warn("Error parsing officialImageUrl:", e);
                if (typeof party.officialImageUrl === 'string') allImageUrls.push(party.officialImageUrl);
            }
        }

        // Mobile Hero Image (Robust Parsing)
        if (party.mobileHeroImage) {
            try {
                let images = [];
                if (Array.isArray(party.mobileHeroImage)) {
                    images = party.mobileHeroImage;
                } else if (typeof party.mobileHeroImage === 'string') {
                    const trimmed = party.mobileHeroImage.trim();
                    if (trimmed.startsWith('[')) {
                        images = JSON.parse(trimmed);
                    } else {
                        images = [trimmed];
                    }
                }
                images.forEach(url => {
                    if (url && typeof url === 'string') allImageUrls.push(url);
                });
            } catch (e) {
                console.warn("Error parsing mobileHeroImage:", e);
                if (typeof party.mobileHeroImage === 'string') allImageUrls.push(party.mobileHeroImage);
            }
        }

        // Group Images
        if (party.groupImageUrls) {
            try {
                let images = [];
                if (Array.isArray(party.groupImageUrls)) {
                    images = party.groupImageUrls;
                } else if (typeof party.groupImageUrls === 'string') {
                    const trimmed = party.groupImageUrls.trim();
                    if (trimmed.startsWith('[')) {
                        images = JSON.parse(trimmed);
                    } else {
                        images = [trimmed];
                    }
                }
                images.forEach(url => {
                    if (url && typeof url === 'string') allImageUrls.push(url);
                });
            } catch (e) {
                console.warn("Error parsing groupImageUrls:", e);
            }
        }

        // Member Images
        if (party.members && Array.isArray(party.members)) {
            party.members.forEach(member => {
                if (member.imageUrl) allImageUrls.push(member.imageUrl);
            });
        }
    });

    // ลบรายการซ้ำ และใส่ getPath
    const uniqueUrls = [...new Set(allImageUrls)].map(url => {
        if (url && url.startsWith('/')) return getPath(url);
        return url;
    });

    console.log(`🖼️ Preloading ${uniqueUrls.length} images...`);

    // Preload ทุกรูปพร้อมกัน (parallel)
    await Promise.all(uniqueUrls.map(url => preloadImage(url)));

    console.log(`✅ Preloaded ${uniqueUrls.length} images successfully!`);
}

/**
 * ดึง crop style จาก cache (sync)
 * @param {string} src - URL ของรูปภาพ
 * @returns {{objectPosition: string} | null}
 */
export function getCropStyle(src) {
    return cropCache.get(src) || null;
}

/**
 * เช็คว่ารูปถูก preload แล้วหรือยัง
 * @param {string} src - URL ของรูปภาพ
 * @returns {boolean}
 */
export function isPreloaded(src) {
    return cropCache.has(src);
}
