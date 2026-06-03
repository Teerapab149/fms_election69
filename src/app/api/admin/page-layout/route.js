import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";
import { hasVariant } from "../../../../components/elements/registry.js";
import crypto from "crypto";

// Day 11: allow-list of the 15 Layer 1 theme tokens (ADR-001 / VISION D9).
// Unknown keys are rejected so a typo can't poison the live token scope.
const VALID_TOKEN_KEYS = new Set([
  "--color-primary", "--color-accent", "--color-bg", "--color-surface",
  "--color-text", "--color-text-muted", "--color-border",
  "--radius-sm", "--radius-md", "--radius-card", "--radius-button",
  "--shadow-card", "--shadow-button",
  "--font-display", "--font-body",
]);

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
    { type: "hero", visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
    { type: "meetCandidates", visible: true, order: 2, config: {} },
    { type: "stats", visible: true, order: 3, config: { showPercentage: true, showTotalEligible: true } },
    { type: "electionBanner", visible: true, order: 4, config: {} },
    { type: "voteCTA", visible: true, order: 5, config: {} },
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
    return NextResponse.json({
      ...pageLayout,
      activeTemplateId: config?.activeTemplateId || "classic"
    });
  } catch (error) {
    console.error("page-layout GET error:", error);
    return NextResponse.json({ ...DEFAULT_PAGE_LAYOUT, activeTemplateId: "classic" });
  }
}

// PUT — admin only
export async function PUT(request) {
  const authError = verifyAdminToken(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Day 10: validate per-element variant overrides against the registry.
    // Shape: { elementVariants: { [pageId]: { [elementId]: variantId } } }.
    // Reject unknown element/variant so a typo never ships to production
    // (where the resolver would silently fall back to 'default').
    const { elementVariants } = body;
    if (elementVariants && typeof elementVariants === "object") {
      for (const [pageId, elementMap] of Object.entries(elementVariants)) {
        if (!elementMap || typeof elementMap !== "object") {
          return NextResponse.json(
            { error: `Invalid elementVariants for page "${pageId}"` },
            { status: 400 }
          );
        }
        for (const [elementId, variantId] of Object.entries(elementMap)) {
          if (!hasVariant(elementId, variantId)) {
            return NextResponse.json(
              { error: `Invalid variant "${variantId}" for element "${elementId}"` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Day 11: validate Layer 1 theme token overrides — strict key allow-list,
    // non-empty string values. Rejects typos before they hit the live scope.
    const { themeTokens, elementVars, elementCss } = body;
    if (themeTokens && typeof themeTokens === "object") {
      for (const [key, value] of Object.entries(themeTokens)) {
        if (!VALID_TOKEN_KEYS.has(key)) {
          return NextResponse.json({ error: `Unknown theme token "${key}"` }, { status: 400 });
        }
        if (typeof value !== "string" || value.trim() === "") {
          return NextResponse.json({ error: `Invalid value for theme token "${key}"` }, { status: 400 });
        }
      }
    }

    // Day 11: validate Layer 2 per-element var overrides — var name must be a
    // CSS custom property (-- prefix), value a non-empty string.
    if (elementVars && typeof elementVars === "object") {
      for (const [pageId, elementMap] of Object.entries(elementVars)) {
        if (!elementMap || typeof elementMap !== "object") {
          return NextResponse.json({ error: `Invalid elementVars for page "${pageId}"` }, { status: 400 });
        }
        for (const [elementId, varMap] of Object.entries(elementMap)) {
          if (!varMap || typeof varMap !== "object") {
            return NextResponse.json({ error: `Invalid elementVars for element "${elementId}"` }, { status: 400 });
          }
          for (const [varKey, val] of Object.entries(varMap)) {
            if (!varKey.startsWith("--") || typeof val !== "string" || val.trim() === "") {
              return NextResponse.json(
                { error: `Invalid var "${varKey}" for element "${elementId}"` },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // Pillar 3: validate Layer 3 per-element custom CSS — each value must be a
    // string (raw declarations). Scoping + `<>` stripping happen at render time
    // (buildElementCss); this is the shape gate before persist.
    if (elementCss && typeof elementCss === "object") {
      for (const [pageId, elementMap] of Object.entries(elementCss)) {
        if (!elementMap || typeof elementMap !== "object") {
          return NextResponse.json({ error: `Invalid elementCss for page "${pageId}"` }, { status: 400 });
        }
        for (const [elementId, css] of Object.entries(elementMap)) {
          if (typeof css !== "string") {
            return NextResponse.json(
              { error: `Invalid custom CSS for element "${elementId}"` },
              { status: 400 }
            );
          }
        }
      }
    }

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
