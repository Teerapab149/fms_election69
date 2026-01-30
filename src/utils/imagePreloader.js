"use client";

import smartcrop from 'smartcrop';

// Global cache สำหรับเก็บผลลัพธ์ smartcrop
const cropCache = new Map();
const imageCache = new Map();

/**
 * Preload รูปภาพและคำนวณ smartcrop ล่วงหน้า
 * @param {string} src - URL ของรูปภาพ
 * @returns {Promise<{objectPosition: string}>}
 */
export async function preloadImage(src) {
    if (!src) return { objectPosition: '50% 35%' };

    // ถ้ามีใน cache แล้ว return ทันที
    if (cropCache.has(src)) {
        return cropCache.get(src);
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;

        img.onload = async () => {
            try {
                // เก็บ Image object ไว้ใน cache (browser จะ cache รูปอัตโนมัติ)
                imageCache.set(src, true);

                // คำนวณ smartcrop
                const result = await smartcrop.crop(img, { width: 500, height: 500 });
                const crop = result.topCrop;

                const centerX = (crop.x + crop.width / 2) / img.width * 100;
                const centerY = (crop.y + crop.height / 2) / img.height * 100;

                const cropStyle = { objectPosition: `${centerX}% ${centerY}%` };

                // เก็บผลลัพธ์ใน cache
                cropCache.set(src, cropStyle);
                resolve(cropStyle);
            } catch (error) {
                // ถ้า smartcrop fail ใช้ค่า default
                const defaultStyle = { objectPosition: '50% 35%' };
                cropCache.set(src, defaultStyle);
                resolve(defaultStyle);
            }
        };

        img.onerror = () => {
            const defaultStyle = { objectPosition: '50% 35%' };
            cropCache.set(src, defaultStyle);
            resolve(defaultStyle);
        };
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

    // ลบรายการซ้ำ
    const uniqueUrls = [...new Set(allImageUrls)];

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
