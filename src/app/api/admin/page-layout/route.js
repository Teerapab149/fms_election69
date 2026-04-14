import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";
import crypto from "crypto";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

function verifyAdminToken(request) {
  const encryptedToken = request.headers.get('x-admin-token');
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
    const [secret, timestamp] = decryptedString.split('|');
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

// Default pageLayout สะท้อน UI ปัจจุบัน (ต้องตรงกับ STYLED_BLOCKS_ARCHITECTURE.md)
const DEFAULT_PAGE_LAYOUT = {
  home: [
    { type: "hero",           visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
    { type: "meetCandidates", visible: true, order: 2, config: {} },
    { type: "stats",          visible: true, order: 3, config: { showPercentage: true, showTotalEligible: true } },
    { type: "electionBanner", visible: true, order: 4, config: {} },
    { type: "voteCTA",        visible: true, order: 5, config: {} },
  ],
  vote: {
    multiParty: {
      gridCols: "auto",
      cardVariant: "grid",
      showDivider: true,
      abstainStyle: "standard",
    },
  },
  theme: {
    primaryColor: "#8A2680",
    accentColor: "#9333EA",
    borderRadius: "rounded",
  },
};

// GET — public (หน้าบ้านต้องดึงได้โดยไม่ต้อง auth)
export async function GET() {
  try {
    const config = await db.systemConfig.findFirst({ where: { id: 1 } });
    const pageLayout = config?.pageLayout ?? DEFAULT_PAGE_LAYOUT;
    return NextResponse.json(pageLayout);
  } catch (error) {
    console.error("page-layout GET error:", error);
    return NextResponse.json(DEFAULT_PAGE_LAYOUT);
  }
}

// PUT — admin only
export async function PUT(request) {
  const authError = verifyAdminToken(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Shallow-merge: ป้องกัน body ว่าง หรือ missing fields
    const updated = await db.systemConfig.update({
      where: { id: 1 },
      data: { pageLayout: body },
    });

    return NextResponse.json(updated.pageLayout);
  } catch (error) {
    console.error("page-layout PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
