import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { adminGuard } from "../../../../lib/auth/adminCheck";

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
    const data = { globalConfig: rest };
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
