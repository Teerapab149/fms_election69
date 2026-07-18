import sharp from "sharp";

/**
 * Downscale + compress an uploaded image so a 4K original doesn't ship full-size
 * (the cause of laggy pages). Keeps it sharp via a sensible max width + quality.
 *
 * @param {Buffer} buffer  raw uploaded bytes
 * @param {object} opts
 * @param {number} opts.maxWidth  cap width (never upscales); default 1600
 * @param {number} opts.quality   JPEG/WebP quality 1-100; default 80
 * @param {"jpeg"|"webp"|"keep"} opts.format  "keep" preserves source format
 *        (use for logos that may need transparency); default "jpeg"
 * @returns {Promise<Buffer>} optimized bytes (falls back to the original on error)
 */
export async function optimizeImage(buffer, { maxWidth = 1600, quality = 80, format = "jpeg" } = {}) {
  try {
    let img = sharp(buffer, { failOn: "none" })
      .rotate() // honour EXIF orientation before stripping metadata
      .resize({ width: maxWidth, withoutEnlargement: true });

    if (format === "jpeg") img = img.jpeg({ quality, mozjpeg: true });
    else if (format === "webp") img = img.webp({ quality });
    // "keep" → no re-encode beyond resize; preserves PNG transparency etc.

    const out = await img.toBuffer();
    // keep whichever is smaller (a heavily-compressed original can beat a re-encode)
    return out.length && out.length < buffer.length ? out : buffer;
  } catch (e) {
    console.warn("[imageOptimize] failed, using original:", e?.message);
    return buffer;
  }
}
