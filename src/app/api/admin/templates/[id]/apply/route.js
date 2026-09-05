import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { requireAdmin } from "../../../../../../lib/auth/adminCheck";
import { getTemplate } from "../../../../../../components/admin/editor/templates";

// Next 15: params ใน route handler เป็น Promise แล้ว ต้อง await ก่อนใช้
// (ของเดิม `{ params }` แล้วอ่าน params.id ตรง ๆ ได้ เพราะ 14 ส่งเป็น object)

// POST /api/admin/templates/:id/apply — set active template
export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const template = await getTemplate(id, db);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const systemConfig = await db.systemConfig.findFirst();
  if (!systemConfig) {
    return NextResponse.json({ error: "SystemConfig not initialized" }, { status: 500 });
  }

  // Applying a template ADOPTS ITS DESIGN WHOLESALE: strip the retired editor's
  // per-element design overrides from pageLayout (they applied on LIVE only —
  // never in the preview — so stale saves from old sessions made the applied
  // site diverge from what the admin previewed, e.g. a cream hero-title from a
  // long-gone dark-theme edit). Structural fields (home block list, vote page
  // settings, legacy theme) are kept — they are layout wiring, not design.
  const prevLayout = (systemConfig.pageLayout && typeof systemConfig.pageLayout === "object")
    ? systemConfig.pageLayout : {};
  const {
    elementConfigs, elementVariants, elementVars, elementCss, themeTokens, // dropped
    ...structuralLayout
  } = prevLayout;

  const updated = await db.systemConfig.update({
    where: { id: systemConfig.id },
    data: { activeTemplateId: id, pageLayout: structuralLayout }
  });

  return NextResponse.json({
    ok: true,
    activeTemplateId: updated.activeTemplateId,
    templateName: template.name
  });
}
