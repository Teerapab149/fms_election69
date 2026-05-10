import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import crypto from "crypto";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
  : null;

function verifyAdminToken(request) {
  const encryptedToken = request.headers.get("x-admin-token");
  const now = Date.now();

  if (!encryptedToken || !PRIVATE_KEY) {
    return NextResponse.json({ error: "Unauthorized / Config Error" }, { status: 401 });
  }

  try {
    const buffer = Buffer.from(encryptedToken, "base64");
    const decryptedData = crypto.privateDecrypt(
      { key: PRIVATE_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      buffer
    );
    const decryptedString = decryptedData.toString("utf8");
    const [secret, timestamp] = decryptedString.split("|");
    const EXPECTED_SECRET = process.env.ADMIN_AUTH_SECRET || "fallback_secret";

    if (secret !== EXPECTED_SECRET) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }
    if (now - parseInt(timestamp) > 3600000) {
      return NextResponse.json({ error: "Token Expired" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: "Invalid Token Format" }, { status: 403 });
  }
}

// GET — admin only (form needs auth to load current values)
export async function GET(request) {
  const authError = verifyAdminToken(request);
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
  const authError = verifyAdminToken(request);
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
