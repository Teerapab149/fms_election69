import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { adminGuard } from "../../../../lib/auth/adminCheck";

// GET — admin only (form needs auth to load current values)
export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;

  try {
    const config = await db.systemConfig.findFirst({ where: { id: 1 } });
    return NextResponse.json({ globalConfig: config?.globalConfig ?? null });
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

    const updated = await db.systemConfig.upsert({
      where: { id: 1 },
      create: { id: 1, globalConfig },
      update: { globalConfig },
    });

    return NextResponse.json({
      success: true,
      globalConfig: updated.globalConfig,
    });
  } catch (error) {
    console.error("global-config PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
