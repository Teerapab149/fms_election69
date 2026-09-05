import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { adminGuard } from "../../../../lib/auth/adminCheck";

// Never statically rendered: this route reads headers/request.url per call. Without
// this Next tries to prerender it at build time, the read throws DynamicServerError,
// and the catch blocks log it — build noise that reads like a real auth failure.
export const dynamic = "force-dynamic";

// GET — admin only (form needs auth to load current values)
export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;

  try {
    const config = await db.systemConfig.findFirst({ where: { id: 1 } });
    // Bridge the googleFormUrl COLUMN into the returned config object so the
    // general-settings form can render/edit it, while success/page.js,
    // check-status, readiness + dashboard keep reading the column directly.
    const globalConfig = {
      ...(config?.globalConfig ?? {}),
      googleFormUrl: config?.googleFormUrl ?? "",
    };
    return NextResponse.json({ globalConfig });
  } catch (error) {
    console.error("global-config GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT — admin only
export async function PUT(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { globalConfig } = body;

    if (typeof globalConfig !== "object" || globalConfig === null) {
      return NextResponse.json({ error: "globalConfig must be an object" }, { status: 400 });
    }

    // googleFormUrl lives in its own COLUMN (readers depend on it there); split
    // it out of the JSON blob. Only write the column when the client actually
    // sent the key, so an older client that omits it never wipes the value.
    const { googleFormUrl, ...rest } = globalConfig;

    // คีย์การรับรองผลไม่ใช่ของ endpoint นี้ — ปฏิเสธทิ้งไปเลย
    //
    // การรับรองผลถูกออกแบบไว้ว่าทำได้เฉพาะบัญชีเจ้าหน้าที่คณะ (role === "STAFF")
    // และทำได้หลังปิดหีบ+ประกาศผลแล้วเท่านั้น แล้วห้ามย้อน — ทั้งหมดอยู่ใน
    // /api/admin/dashboard (route.js:165-196) แต่ endpoint นี้ผ่านแค่ adminGuard
    // คือกรรมการสโมฯ คนไหนก็เรียกได้ ถ้าปล่อยให้เขียนคีย์พวกนี้ได้ กรรมการจะ
    // เซ็นรับรองผลของตัวเองได้โดยไม่ต้องเป็นเจ้าหน้าที่ ซึ่งคือ conflict of interest
    // ที่ด่าน STAFF ตั้งขึ้นมากันพอดี
    //
    // `ballotsAnonymized` ยังเป็นด่านที่ /api/vote (route.js:59) ใช้ปฏิเสธคะแนนหลัง
    // รับรองผลแล้ว การล้างค่านี้ทิ้งจึงเท่ากับ "เปิดหีบที่ปิดไปแล้ว" กลับมาอีกครั้ง
    const CERTIFICATION_KEYS = ["ballotsAnonymized", "certifiedAt", "certifiedBy", "certifiedByUsername"];
    const attempted = CERTIFICATION_KEYS.filter((k) => k in rest);
    if (attempted.length > 0) {
      return NextResponse.json(
        { error: `แก้ค่าการรับรองผลที่นี่ไม่ได้ (${attempted.join(", ")}) — การรับรองผลทำได้เฉพาะบัญชีเจ้าหน้าที่คณะผ่านหน้าแดชบอร์ด` },
        { status: 403 }
      );
    }

    // ผสานทับของเดิม ไม่ใช่เขียนทับทั้งก้อน
    //
    // ของเดิมเขียน `globalConfig: rest` ตรง ๆ ซึ่งแทนที่ JSON ทั้งอัน คีย์ไหนที่ client
    // ไม่ได้ส่งมาก็หายทันที ฟอร์มตั้งค่าทั่วไปส่งมาเฉพาะฟิลด์ของตัวเอง เพราะงั้นแค่กด
    // "บันทึก" ครั้งเดียวหลังรับรองผล ก็ลบลายเซ็นรับรองทิ้งทั้งชุดโดยไม่มีใครตั้งใจ
    // และปลดล็อกให้ /api/vote รับคะแนนได้อีก
    const current = await db.systemConfig.findUnique({ where: { id: 1 }, select: { globalConfig: true } });
    const merged = { ...(current?.globalConfig ?? {}), ...rest };

    const data = { globalConfig: merged };
    if (googleFormUrl !== undefined) data.googleFormUrl = googleFormUrl;

    const updated = await db.systemConfig.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });

    return NextResponse.json({
      success: true,
      globalConfig: {
        ...(updated.globalConfig ?? {}),
        googleFormUrl: updated.googleFormUrl ?? "",
      },
    });
  } catch (error) {
    console.error("global-config PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
