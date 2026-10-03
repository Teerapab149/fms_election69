import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";
import { bustSiteData } from "../../../../lib/cache/siteData";
import { hasVariant } from "../../../../components/elements/registry.js";
import { adminGuard } from "../../../../lib/auth/adminCheck";
import { validateThemeTokens, validateElementVars, validateElementCss } from "../../../../lib/cssSafety.mjs";

// E2E-DIAG: GET below takes no `request` and reads only the DB, so Next 14's App
// Router classified this route as STATIC and prerendered its body at BUILD time
// (`○ /api/admin/page-layout` — the only ○ in the whole app; every other route is
// ƒ because it touches cookies/headers). The baked payload froze whatever
// activeTemplateId the *build machine's* DB happened to hold, so at runtime every
// page that dispatches its template off this endpoint rendered the build-time
// template forever — an admin template switch could never take effect, and a
// Docker build with no DB reachable would bake the `classic` catch-branch.
// force-dynamic restores a per-request DB read. Do NOT remove.
export const dynamic = "force-dynamic";

// Day 11: allow-list of the 15 Layer 1 theme tokens (ADR-001 / VISION D9).
// Unknown keys are rejected so a typo can't poison the live token scope.
const VALID_TOKEN_KEYS = new Set([
  "--color-primary", "--color-accent", "--color-bg", "--color-surface",
  "--color-text", "--color-text-muted", "--color-border",
  "--radius-sm", "--radius-md", "--radius-card", "--radius-button",
  "--shadow-card", "--shadow-button",
  "--font-display", "--font-body",
]);

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
  const authError = await adminGuard(request);
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

    // Layer 1 tokens, Layer 2 element vars, Layer 3 custom CSS all end up inside
    // the <style> tag the root layout renders on every public page. The old
    // checks here were "is it a non-empty string", which let
    // `red}</style><script>…` through (H1, 2026-09-25). cssSafety validates each
    // value by what it is supposed to be (colour, length, font stack …), and the
    // page/element ids and var names by a strict identifier pattern.
    // templateTokens.js re-checks at render time — this is the layer that tells
    // the admin what was wrong instead of silently dropping it.
    const { themeTokens, elementVars, elementCss } = body;
    const styleErrors = [
      ...validateThemeTokens(themeTokens, VALID_TOKEN_KEYS),
      ...validateElementVars(elementVars),
      ...validateElementCss(elementCss),
    ];
    if (styleErrors.length > 0) {
      return NextResponse.json(
        { error: `ค่าธีมไม่ผ่านการตรวจ: ${styleErrors[0]}`, errors: styleErrors.slice(0, 20) },
        { status: 400 }
      );
    }

    // Shallow-merge: ป้องกัน body ว่าง หรือ missing fields
    const updated = await db.systemConfig.update({
      where: { id: 1 },
      data: { pageLayout: body },
    });

    bustSiteData(); // admin change must show on the next request, not after the TTL
    return NextResponse.json(updated.pageLayout);
  } catch (error) {
    console.error("page-layout PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
