import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "../../../../../lib/auth/adminCheck";
import { optimizeImage } from "../../../../../lib/imageOptimize";

// POST /api/admin/global-config/banner — upload the election announcement poster.
//
// WHY THIS EXISTS. The poster on the home page was hardcoded in three separate
// layouts (the classic banner-section element, BlossomHome, FmsOfficialHome) and
// admin could only toggle its VISIBILITY. So the shipped image still read
// "วันศุกร์ที่ 6 กุมภาพันธ์ 2569" while the system was running SAMO 50 for
// academic year 2570 — the faculty's own site publishing last year's polling
// date. That is not a styling gap, it is wrong information on a page students
// trust, and it could not be fixed from the admin console at all.
//
// NO SCHEMA CHANGE: the resulting path is stored under `electionBannerUrl` in
// SystemConfig.globalConfig, which is a Json column. Nothing migrates.
//
// The written file lands in public/images/banner, which docker-compose
// bind-mounts (`./public/images:/app/public/images`) — so an uploaded poster
// survives a redeploy instead of vanishing with the container.

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "ต้องส่งเป็น multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Same pipeline the candidate uploads use. A poster is wide artwork, so it
    // gets the generous width — text inside the image has to stay readable.
    const optimized = await optimizeImage(buffer, { maxWidth: 1600, quality: 82, format: "keep" });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    // Timestamped filename, never a fixed one: a stable name would be served
    // from the browser (and any CDN) cache after a replacement, so staff would
    // upload a corrected poster and still see the old one.
    const fileName = `election-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public/images/banner");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), optimized);

    // The stored value is a ROOT-RELATIVE app path with no basePath — every
    // reader runs it through getPath(), which is what prepends /fms-ovs. Baking
    // the basePath in here would double it in Docker.
    return NextResponse.json({ ok: true, url: `/images/banner/${fileName}` });
  } catch (err) {
    console.error("[POST /api/admin/global-config/banner]", err);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
