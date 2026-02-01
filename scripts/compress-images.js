const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const TARGET_DIR = path.join(__dirname, '../public/images');
const MAX_WIDTH = 800; // Resize to max 800px width
const QUALITY = 80; // JPEG/WebP quality

// Recursive function to walk through directories
async function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await walk(filePath));
        } else {
            // Filter only image files
            if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
                results.push(filePath);
            }
        }
    }
    return results;
}

async function compressImages() {
    console.log('🔍 Scanning for images in:', TARGET_DIR);

    try {
        const files = await walk(TARGET_DIR);
        console.log(`✅ Found ${files.length} images.`);

        for (const file of files) {
            // const ext = path.extname(file).toLowerCase(); // Moved down
            const tempFile = file + '.tmp';

            // Get file stats
            const stats = fs.statSync(file);
            const sizeMB = stats.size / (1024 * 1024);

            // Skip if small enough (e.g. < 300KB)
            if (stats.size < 300 * 1024) {
                console.log(`Skipping (Small enough): ${path.relative(TARGET_DIR, file)}`);
                continue;
            }

            // Determine settings based on file type/path
            let pipeline = sharp(file).rotate(); // Auto-rotate
            const lowerFile = file.toLowerCase();
            const ext = path.extname(file).toLowerCase();
            const isPng = ext === '.png';
            const isWebP = ext === '.webp';

            if (lowerFile.includes('logo')) {
                console.log(`Skipping LOGO completely (Untouched): ${path.relative(TARGET_DIR, file)}`);
                continue; // Skip all processing for logos
            }
            else if (lowerFile.includes('banner') || lowerFile.includes('hero')) {
                console.log(`Optimizing BANNER (Max 4K): ${path.relative(TARGET_DIR, file)}`);
                pipeline = pipeline.resize({ width: 3840, withoutEnlargement: true });
            }
            else if (lowerFile.includes('groupimage') || lowerFile.includes('group')) {
                console.log(`Optimizing GROUP IMAGE (50% scale): ${path.relative(TARGET_DIR, file)}`);
                // Get metadata to calculate 50%
                const metadata = await sharp(file).metadata();
                const newWidth = Math.round(metadata.width * 0.5);
                pipeline = pipeline.resize({ width: newWidth });
            }
            else {
                console.log(`Optimizing MEMBER/OTHER (800px): ${path.relative(TARGET_DIR, file)}`);
                pipeline = pipeline.resize({ width: 800, withoutEnlargement: true });
            }

            // Output Format Logic (Preserve Transparency)
            if (isPng) {
                pipeline = pipeline.png({ quality: QUALITY, compressionLevel: 9 });
            } else if (isWebP) {
                pipeline = pipeline.webp({ quality: QUALITY });
            } else {
                pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
            }

            try {
                await pipeline.toFile(tempFile);

                // Replace original
                fs.unlinkSync(file);
                fs.renameSync(tempFile, file);

                const newStats = fs.statSync(file);
                const newSizeMB = newStats.size / (1024 * 1024);
                console.log(`   reduced to ${newSizeMB.toFixed(2)} MB`);

            } catch (err) {
                console.error(`Error processing ${file}:`, err);
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            }
        }
        console.log('🎉 Compression Complete!');

    } catch (error) {
        console.error("Error scanning files:", error);
    }
}

compressImages();
